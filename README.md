# rockmouse-site

The RockMouse AI Agents showcase, as a single Cloudflare Worker: the static
site (`public/`) and the Claude API proxy (`worker/index.js`) live in one
project, deployed together, git-connected via Workers Builds.

This replaces the old two-project setup — a Pages project for the site plus
a separate `rockmouse-agent-proxy` Worker — with one project. The site now
calls its own `/api/agent` path instead of a separate `workers.dev` URL.

## One-time setup

```bash
# 1. Install deps and log in (opens a browser tab to authorise)
npm install -g wrangler
wrangler login

# 2. Create the Worker for the first time (from this folder)
wrangler deploy

# 3. Set the secrets (never committed — these live only in Cloudflare)
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put DEMO_SHARED_TOKEN
# Optional — only if you want the signup notification email:
wrangler secret put RESEND_API_KEY
wrangler secret put NOTIFY_TO
# Optional — only if you want the Gmail-based daily sign-in digest (see below):
wrangler secret put DIGEST_API_TOKEN
```

Use the same `DEMO_SHARED_TOKEN` value that's already baked into
`public/rockmouse_showcase.js` (`API_CONFIG.sharedToken`) unless you're
rotating it — if you rotate it, update that file to match and redeploy.

## Connect it to GitHub (Workers Builds)

```bash
git init
git add .
git commit -m "Initial commit"

# Create an empty repo on GitHub first (github.com/new, or `gh repo create`), then:
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Then in the Cloudflare dashboard: **Workers & Pages → rockmouse-site →
Settings → Builds → Connect** → pick the repo and branch. From then on,
every push to that branch redeploys automatically — no more manual
`wrangler deploy`.

## Domain

`rockmouse.live` (including `/agents`) is served by this Worker, not by
the old `rockmouse-agents` Pages project — that migration is done. If you
ever need to redo it on a fresh project: Cloudflare dashboard → **Workers &
Pages → rockmouse-site (Worker) → Settings → Domains & Routes → Add →
Custom domain** → `rockmouse.live`. DNS/SSL are automatic since it's
already on Cloudflare.

## Cleaning up afterwards (optional, once you're confident it's stable)

- Delete the old `rockmouse-agents` Pages project.
- Delete the old standalone `rockmouse-agent-proxy` Worker (its job is now
  done by `/api/agent` in this project).
- The `proxy/` folder one level up (outside this repo) is now historical —
  keep it or delete it, nothing depends on it anymore.

## Local testing

```bash
cp .dev.vars.example .dev.vars   # fill in real values, this file is gitignored
wrangler dev
```

## Daily sign-in digest

Craig gets one email a day listing who signed in to `/agents` in the last
24 hours, sent via his Gmail account rather than Resend/Outlook (Resend's
`sendDailyDigest()` cron in `worker/index.js` is still wired up and
harmless if left unconfigured, but the digest Craig actually receives is
a separate Claude scheduled task — "RockMouse Labs — daily sign-in digest
(Gmail)" — that fires once a day, calls `GET /api/digest-data` on this
Worker, and sends the result through his connected Gmail account. It isn't
part of this repo; look for it in Claude's scheduled tasks if it needs
updating.

For that scheduled task to work, this Worker needs the `DIGEST_API_TOKEN`
secret set (see One-time setup above) to the same value the scheduled task
sends as `Authorization: Bearer <token>` — rotate the secret any time to
revoke access, just update the scheduled task's prompt to match.

## Files

- `public/` — everything served as-is: `index.html`, `rockmouse_showcase.js`,
  `assets/` (logos), `Agents/` (individual agent pages).
- `worker/index.js` — handles the few paths static assets don't:
  `POST /api/agent` (agent runs + the signup notification email),
  `GET /admin/logins` (sign-up list, sits behind Cloudflare Access —
  configured in the dashboard, not in code), and `GET /api/digest-data`
  (see below). Every other path is static-asset territory.
- `wrangler.jsonc` — Worker + static-assets config, D1 binding, and the
  cron trigger for the daily digest.
- `migrations/0001_logins.sql` — the `logins` D1 table (email, name,
  user_agent, created_at) written on every successful sign-in.
