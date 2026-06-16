# Deploy to Vercel

This project is a TanStack Start app with a Nitro server. `vercel.json` switches
the build to Nitro's `vercel` preset so Vercel gets the Build Output API
directory (`.vercel/output`) it expects.

## 1. Push the repo

Push to GitHub / GitLab / Bitbucket. Vercel deploys from a connected git repo.

## 2. Import in Vercel

1. Vercel dashboard → **Add New… → Project** → pick the repo.
2. **Framework Preset:** `Other` (Vercel will read `vercel.json`).
3. Leave Build / Output / Install commands **empty** — `vercel.json` sets them:
   - Build:   `NITRO_PRESET=vercel vite build`
   - Install: `bun install`
   - Output:  auto-detected from `.vercel/output` (Build Output API v3)

## 3. Environment variables

Add these under **Settings → Environment Variables** (Production + Preview):

**Required (frontend + SSR):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

**Required for admin / privileged server functions:**
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional (Cloudflare Turnstile bot protection):**
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Values come from your Lovable Cloud / Supabase project. The `VITE_*` versions
are inlined into the client bundle at build time; the non-prefixed versions are
read by server functions at request time — both are needed.

## 4. Deploy

Click **Deploy**. First build takes ~2–3 min. After it finishes, the deployment
summary should show **Build Output API v3** and a working URL like
`your-project.vercel.app`.

## 5. Custom domain

**Project → Settings → Domains** → add your domain and follow the DNS steps.

After the domain is live, add the full URL (e.g. `https://blacklisted.world`) to
your Supabase project's **Auth → URL Configuration → Redirect URLs**, otherwise
OAuth / magic-link callbacks fail with a redirect error.

## How it works

- `vercel.json` runs `NITRO_PRESET=vercel vite build`. Nitro emits
  `.vercel/output/` in the [Build Output API v3](https://vercel.com/docs/build-output-api/v3)
  format, which Vercel auto-detects — no `outputDirectory` setting needed.
- The TanStack Start SSR handler (`src/server.ts`) runs as a Vercel serverless
  function.
- Static assets in `.vercel/output/static/` are served by Vercel's CDN.

## Coexisting with Lovable preview

The Lovable preview (`*.lovable.app`) keeps building for Cloudflare Workers —
the `NITRO_PRESET=vercel` override only applies when Vercel runs the build.
Both targets ship from the same repo without conflict.

## Troubleshooting

- **"No Output Directory named 'output' found"** — do not set `outputDirectory`
  in `vercel.json`. Nitro's vercel preset uses the Build Output API; Vercel
  finds it automatically.
- **Auth redirects fail in production** — add the Vercel domain (and any custom
  domain) to Supabase Auth redirect URLs.
- **`process.env.X is undefined` at runtime** — env var wasn't set for the
  current environment (Production vs Preview). Add it and redeploy.
- **Want npm instead of bun** — change `installCommand` in `vercel.json` to
  `npm install` (and commit a `package-lock.json`).
