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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/agent") {
      return handleAgentApi(request, env);
    }
    // Reaching here means the request matched no static file in public/ either —
    // a genuine 404, not something this Worker needs to route.
    return new Response("Not found", { status: 404 });
  },
};
