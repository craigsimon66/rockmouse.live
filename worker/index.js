/**
 * RockMouse AI Agents — unified Worker (static site + Claude API proxy)
 * ───────────────────────────────────────────────────────────────────
 * Serves the showcase site itself (public/) as static assets, and handles
 * the one API route the site calls: POST /api/agent.
 *
 * Static assets are matched and served by Cloudflare BEFORE this fetch
 * handler ever runs — this code only sees requests that don't match a file
 * in public/, which in practice means /api/agent and genuine 404s.
 *
 * Required Worker secrets (wrangler secret put <name>):
 *   ANTHROPIC_API_KEY   — your Anthropic API key (sk-ant-...)
 *   DEMO_SHARED_TOKEN   — random string the site sends in Authorization. Rotate to revoke access.
 *
 * Optional secrets (email notification on signup — silently skipped if unset):
 *   RESEND_API_KEY, NOTIFY_TO, NOTIFY_FROM
 *
 * Optional secret (Gmail-based daily digest, see /api/digest-data above):
 *   DIGEST_API_TOKEN   — random bearer token; the scheduled digest task sends
 *                        it as "Authorization: Bearer <token>". Unset = route returns 500.
 *
 * Plain vars (see wrangler.jsonc):
 *   ALLOWED_ORIGIN, DEFAULT_MODEL, MAX_TOKENS
 */

const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MODEL_ALIASES = {
  "claude-sonnet-4-6": "claude-sonnet-4-5",
  "claude-opus-4-6":   "claude-opus-4-1-20250805",
  "claude-haiku-4-5":  "claude-haiku-4-5-20251001",
};

function corsHeaders(origin, allowed) {
  const list = (allowed || "*").split(",").map(s => s.trim());
  const ok = list.includes("*") || list.includes(origin);
  return {
    "Access-Control-Allow-Origin":  ok ? (origin || "*") : list[0] || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Visitor-Email",
    "Access-Control-Max-Age":       "86400",
    "Vary":                         "Origin",
  };
}

// Send a notification email to the site owner via Resend.
// Fails quiet — a Resend outage should never block a visitor from using the site.
async function sendSignupNotification(env, payload) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO) return { skipped: true, reason: "resend not configured" };
  try {
    const body = {
      from:    env.NOTIFY_FROM || "onboarding@resend.dev",
      to:      [env.NOTIFY_TO],
      subject: `New RockMouse agent demo signup: ${payload.email || "(no email)"}`,
      text:    [
        "A new visitor has signed up to try the RockMouse AI Agents showcase.",
        "",
        `Email:      ${payload.email || "—"}`,
        `Name:       ${payload.name || "—"}`,
        `Timestamp:  ${new Date().toISOString()} (UTC)`,
        `Sydney:     ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}`,
        `Origin:     ${payload.origin || "—"}`,
        `User-Agent: ${payload.userAgent || "—"}`,
        "",
        "This email was sent automatically by the RockMouse agent Worker.",
      ].join("\n"),
    };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + env.RESEND_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, detail: text.slice(0, 500) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function json(body, status, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

async function handleAgentApi(request, env) {
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  // Auth check
  const auth = request.headers.get("Authorization") || "";
  const expected = "Bearer " + (env.DEMO_SHARED_TOKEN || "");
  if (!env.DEMO_SHARED_TOKEN || auth !== expected) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Invalid JSON body" }, 400, cors);
  }

  // ─── SIGNUP ACTION ───
  // Sent once by the site when a new visitor submits the email gate.
  // Dispatches a notification email to the site owner. No storage.
  if (body && body.action === "signup") {
    const payload = {
      email:     (body.email || "").toString().trim().slice(0, 200),
      name:      (body.name  || "").toString().trim().slice(0, 200),
      origin:    origin,
      userAgent: (request.headers.get("User-Agent") || "").slice(0, 400),
    };
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return json({ error: "Valid email required" }, 400, cors);
    }
    if (env.rockmouse_logins) {
      try {
        await env.rockmouse_logins
          .prepare("INSERT INTO logins (email, name, user_agent) VALUES (?, ?, ?)")
          .bind(payload.email, payload.name || null, payload.userAgent || null)
          .run();
      } catch (err) {
        // Never block a visitor over a logging failure.
        console.warn("D1 insert failed:", err);
      }
    }
    const result = await sendSignupNotification(env, payload);
    return json({ ok: true, notified: !!result.ok, detail: result }, 200, cors);
  }

  // ─── AGENT RUN ACTION (default) ───
  const { agentId, systemPrompt, userInput, messages: messagesArray } = body || {};
  let { model, maxTokens: requestMaxTokens } = body || {};

  if (!systemPrompt || (!userInput && (!messagesArray || !messagesArray.length))) {
    return json({ error: "systemPrompt and either userInput or messages[] are required" }, 400, cors);
  }
  if (messagesArray) {
    if (!Array.isArray(messagesArray) || messagesArray.some(m => !m.role || !m.content)) {
      return json({ error: "messages must be an array of { role, content } objects" }, 400, cors);
    }
    const roles = messagesArray.map(m => m.role);
    if (roles[0] !== "user") {
      return json({ error: "messages must start with a user turn" }, 400, cors);
    }
  }

  // Soft gate: require the visitor email header (set by the site after the gate is cleared).
  const visitorEmail = (request.headers.get("X-Visitor-Email") || "").trim();
  if (!visitorEmail) {
    return json({ error: "Visitor email required — complete the site gate first" }, 403, cors);
  }

  model = MODEL_ALIASES[model] || model || MODEL_ALIASES[env.DEFAULT_MODEL] || env.DEFAULT_MODEL || MODEL_ALIASES[DEFAULT_MODEL];
  const maxTokens = Math.min(
    requestMaxTokens ? parseInt(requestMaxTokens, 10) : parseInt(env.MAX_TOKENS || DEFAULT_MAX_TOKENS, 10),
    4096
  );

  const messages = messagesArray || [{ role: "user", content: userInput }];

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return json({
        error: "Upstream error",
        status: upstream.status,
        detail: data?.error || data,
      }, upstream.status, cors);
    }

    const output = (data.content || [])
      .filter(c => c.type === "text")
      .map(c => c.text)
      .join("\n\n");

    return json({
      output,
      model: data.model,
      usage: data.usage,
      agentId: agentId || null,
    }, 200, cors);
  } catch (err) {
    return json({ error: "Proxy exception", message: String(err) }, 500, cors);
  }
}

// Cloudflare Access sits in front of /admin/* at the edge (configured in the
// dashboard, not here) — only you can reach this route at all. This handler
// doesn't re-check auth; it just renders what Access has already let through.
async function handleAdminLogins(request, env) {
  if (!env.rockmouse_logins) {
    return new Response("No database configured.", { status: 500 });
  }
  const { results } = await env.rockmouse_logins
    .prepare("SELECT email, name, user_agent, created_at FROM logins ORDER BY created_at DESC LIMIT 500")
    .all();

  const rows = results.map(r => `
    <tr>
      <td>${escapeHtml(r.created_at)}</td>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.name || "")}</td>
      <td class="ua">${escapeHtml(r.user_agent || "")}</td>
    </tr>`).join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>RockMouse AI Agents — Logins</title>
<style>
  body { font-family: -apple-system, sans-serif; margin: 2rem; color: #1a1a2e; }
  h1 { font-size: 1.3rem; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e5ea; font-size: 0.9rem; }
  th { color: #666; font-weight: 600; }
  .ua { color: #888; font-size: 0.78rem; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .count { color: #666; font-size: 0.9rem; }
</style>
</head>
<body>
  <h1>RockMouse AI Agents — sign-ups</h1>
  <div class="count">${results.length} record${results.length === 1 ? "" : "s"} (most recent 500)</div>
  <table>
    <thead><tr><th>When</th><th>Email</th><th>Name</th><th>Browser</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">No sign-ups yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Lightweight JSON endpoint for the Gmail-based daily digest (see
// craig's scheduled Claude task). Separate from /admin/* on purpose:
// /admin/* sits behind Cloudflare Access at the edge, which a scheduled
// automation can't complete an interactive login for. This route instead
// checks a single shared-secret bearer token (DIGEST_API_TOKEN) so it can
// be called unattended. Rotate DIGEST_API_TOKEN any time to revoke access.
async function handleDigestData(request, env) {
  if (!env.DIGEST_API_TOKEN) {
    return json({ error: "DIGEST_API_TOKEN not configured" }, 500, {});
  }
  const auth = request.headers.get("Authorization") || "";
  const provided = auth.replace(/^Bearer\s+/i, "");
  if (provided !== env.DIGEST_API_TOKEN) {
    return json({ error: "Unauthorized" }, 401, {});
  }
  if (!env.rockmouse_logins) {
    return json({ error: "No database configured" }, 500, {});
  }
  const { results: last24h } = await env.rockmouse_logins
    .prepare("SELECT email, name, created_at FROM logins WHERE created_at >= datetime('now', '-1 day') ORDER BY created_at DESC")
    .all();
  const { results: last7d } = await env.rockmouse_logins
    .prepare("SELECT COUNT(DISTINCT email) as n FROM logins WHERE created_at >= datetime('now', '-7 day')")
    .all();
  const { results: allTime } = await env.rockmouse_logins
    .prepare("SELECT COUNT(DISTINCT email) as n FROM logins")
    .all();
  return json({
    generated_at: new Date().toISOString(),
    last_24h_count: last24h.length,
    last_24h: last24h,
    unique_last_7d: last7d[0]?.n ?? null,
    unique_all_time: allTime[0]?.n ?? null,
  }, 200, {});
}

// Fires once a day (see wrangler.jsonc triggers.crons) — emails a summary of
// the last 24 hours of sign-ups. Sends even on a zero-signup day on purpose:
// a digest that only shows up when there's activity is indistinguishable
// from a broken cron.
async function sendDailyDigest(env) {
  if (!env.rockmouse_logins || !env.RESEND_API_KEY || !env.NOTIFY_TO) return;

  const { results } = await env.rockmouse_logins
    .prepare("SELECT email, name, created_at FROM logins WHERE created_at >= datetime('now', '-1 day') ORDER BY created_at DESC")
    .all();

  const lines = results.length
    ? results.map(r => `${r.created_at}  ${r.email}${r.name ? " (" + r.name + ")" : ""}`).join("\n")
    : "(no sign-ups in the last 24 hours)";

  const body = {
    from:    env.NOTIFY_FROM || "onboarding@resend.dev",
    to:      [env.NOTIFY_TO],
    subject: `RockMouse AI Agents — daily sign-ups (${results.length})`,
    text:    `${results.length} sign-up${results.length === 1 ? "" : "s"} in the last 24 hours:\n\n${lines}`,
  };

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + env.RESEND_API_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("Daily digest send failed:", err);
  }
}

// ─── VISITOR GATE ───
// The showcase's email gate sets an rm_visitor_email cookie scoped to
// .rockmouse.live. Agent pages under /Agents/ are routed through this Worker
// (see "run_worker_first" in wrangler.jsonc) so a direct link cannot bypass the
// gate; the relay at /api/agent requires the same cookie. Visitors without it are
// sent to the home page, which returns them here after the gate.
function hasVisitorCookie(request) {
  const cookie = request.headers.get("Cookie") || "";
  return /(?:^|;\s*)rm_visitor_email=[^;]+/.test(cookie);
}
function redirectToGate(request) {
  const url = new URL(request.url);
  const back = `https://rockmouse.live${url.pathname}${url.search}`;
  return Response.redirect(`https://rockmouse.live/?return=${encodeURIComponent(back)}`, 302);
}

async function handleMessagesRelay(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400, {}); }
  if (!body || !Array.isArray(body.messages) || !body.messages.length) {
    return json({ error: "messages[] required" }, 400, {});
  }
  const payload = {
    model: MODEL_ALIASES[body.model] || body.model || env.DEFAULT_MODEL || DEFAULT_MODEL,
    max_tokens: Math.min(parseInt(body.max_tokens, 10) || 1024, 4096),
    messages: body.messages,
  };
  if (body.system) payload.system = body.system;
  if (typeof body.temperature === "number") payload.temperature = body.temperature;
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "Content-Type": "application/json" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/Agents/")) {
      if (!hasVisitorCookie(request)) return redirectToGate(request);
      return env.ASSETS.fetch(request);
    }
    if (url.pathname === "/api/messages") {
      // Same-origin, cookie-gated relay in the Anthropic Messages shape, so the
      // older agent pages (which post {model, max_tokens, system, messages} and
      // read data.content[].text) can move off the open workers.dev proxy
      // without changing their client code.
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, {});
      if (!hasVisitorCookie(request)) return json({ error: "Sign in on rockmouse.live first" }, 403, {});
      return handleMessagesRelay(request, env);
    }
    if (url.pathname === "/api/agent") {
      if (request.method !== "OPTIONS" && !hasVisitorCookie(request)) {
        return json({ error: "Sign in on rockmouse.live first" }, 403, {});
      }
      return handleAgentApi(request, env);
    }
    if (url.pathname === "/admin/logins") {
      return handleAdminLogins(request, env);
    }
    if (url.pathname === "/api/digest-data") {
      return handleDigestData(request, env);
    }
    // Reaching here means the request matched no static file in public/ either —
    // a genuine 404, not something this Worker needs to route.
    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailyDigest(env));
  },
};
