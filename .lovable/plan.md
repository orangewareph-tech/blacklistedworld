## Goal
Lock down registration and submissions: every applicant must register, verify email, pass CAPTCHA, optionally verify a phone number, and receive a ticket number upon submitting a report or pre‑assessment.

## Phase 1 — Database & Auth config

1. **Profiles** — add `username` (unique, lowercased, 3–24 chars, `[a-z0-9_]`), `phone_verified_at` (timestamptz), `email_verified_at` (timestamptz). Trigger `handle_new_user` updated to pull `username` from signup metadata; add unique index.
2. **Reports** — add `ticket_number text unique` populated by a `BEFORE INSERT` trigger generating `BL-YYYY-NNNNNN` from a sequence `report_ticket_seq`.
3. **Pre‑assessments** — new table `pre_assessments` (subject_name, country, transaction_type, description, status, ticket number via same scheme, submitter_id) with RLS: insert by authenticated user, select own + admins, admins manage.
4. **Auth config** — disable `auto_confirm_email` so users must click the confirmation link before they can submit.

## Phase 2 — Anti‑bot (Cloudflare Turnstile)

- Public site key embedded via `VITE_TURNSTILE_SITE_KEY` (build secret).
- Secret `TURNSTILE_SECRET_KEY` used server‑side.
- New server fn `verifyTurnstile(token)` (TanStack `createServerFn`) calls `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
- Widget shown on: signup form, report submit form, pre‑assessment form. Submit buttons disabled until token present; server fns reject if token missing/invalid.

## Phase 3 — Mobile OTP (Twilio)

- Uses Supabase Auth native Phone provider (Twilio backend). User configures Twilio Account SID + Auth Token + From number in the Lovable Cloud → Auth → Phone settings (instructions provided in chat — Supabase tool doesn't expose phone provider config).
- New `/verify-phone` route: user enters phone → `supabase.auth.signInWithOtp({phone, ...})` style verification via `updateUser({phone})` + OTP code entry. On success, stamp `profiles.phone_verified_at = now()`.
- Phone verification optional but recommended; a banner on submit pages nudges the user.

## Phase 4 — Submission gating

- `/submit` and new `/pre-assessment` routes wrapped in a `<RequireVerified>` guard that checks `user.email_confirmed_at` and shows a "Please verify your email" screen with resend button if missing.
- After successful submission the UI shows the generated `ticket_number` prominently and links to the user's report/ticket page.

## Phase 5 — UI updates

- Auth page: add username field at signup (validated client + server side via Zod), Turnstile widget below the form, "We will email you a confirmation link" notice.
- New `/profile` section: shows email verification state, phone verification state (with link to verify), and a list of the user's tickets (reports + pre‑assessments) with ticket numbers and status.
- New `/pre-assessment` page (form similar to submit, fewer fields).

## What I'll need from you
1. Cloudflare Turnstile **site key** + **secret key** — I'll request them via the secret prompt. (Free at dash.cloudflare.com → Turnstile.)
2. After this ships, configure Twilio in Lovable Cloud → Auth → Phone provider (Account SID, Auth Token, From number) — instructions will appear in the verify‑phone screen.

## Not in this change
- IP rate limiting / IP monitoring (backend rate‑limiting primitives not available yet — will be addressed separately).
- Manual review queue UI for admins beyond what already exists in `/admin`.
- Identity document upload for "additional identification before publishing serious allegations" — flagged as a follow‑up.

Approve and I'll start with the migration + secret request.