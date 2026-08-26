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

## Move the domain over

`rockmouse.live` is currently attached to the old `rockmouse-agents` Pages
project. Once this Worker is live and tested on its `*.workers.dev` URL:

1. Cloudflare dashboard → **Workers & Pages → rockmouse-agents (Pages) →
   Custom domains** → remove `rockmouse.live`.
2. **Workers & Pages → rockmouse-site (Worker) → Settings → Domains &
   Routes → Add → Custom domain** → enter `rockmouse.live`.

DNS and SSL are handled automatically since it's already on Cloudflare —
this should take a couple of minutes to go live.

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

## Files

- `public/` — everything served as-is: `index.html`, `rockmouse_showcase.js`,
  `assets/` (logos), `Agents/` (individual agent pages).
- `worker/index.js` — handles `POST /api/agent` only (agent runs + the
  signup notification email). Every other path is static-asset territory
  and never reaches this code.
- `wrangler.jsonc` — Worker + static-assets config.
