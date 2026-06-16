# Deploying to Vercel

This project is built on TanStack Start with a Nitro server. Inside Lovable's
sandbox the build always targets Cloudflare Workers, but `vercel.json` switches
the build to Nitro's `vercel` preset when deployed on Vercel.

## One-time setup

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel → **New Project**.
3. Framework preset: **Other** (Vercel reads `vercel.json`).
4. Add Environment Variables (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TURNSTILE_SITE_KEY` (optional)
   - `TURNSTILE_SECRET_KEY` (optional)
5. Deploy.

## How it works

- `vercel.json` runs `NITRO_PRESET=vercel vite build`, which produces the
  Vercel Build Output API directory (`.vercel/output`).
- The TanStack Start server (`src/server.ts`) runs as a Vercel Edge/Node
  function automatically — no extra config needed.
- Static assets (`/assets/*`, favicon, etc.) are served from the output's
  `static/` folder by Vercel's CDN.

## Custom domains

Add the domain in Vercel → Project → Settings → Domains. Update Supabase Auth
redirect URLs to include the Vercel domain so OAuth callbacks resolve.

## Notes

- `bun install` is used for installs to match local dev. Switch `installCommand`
  to `npm install` if you prefer npm on Vercel.
- The Lovable preview (`*.lovable.app`) keeps using Cloudflare — both targets
  can coexist from the same repo.
