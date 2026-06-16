# Full Admin CMS Upgrade

Delivering all 10 items grouped into 4 phases so each phase ships something usable.

## Phase 1 — Reports CMS polish
- Bulk approve / reject / delete with checkbox column on Reports tab.
- Inline edit for risk and category (popover select, saves immediately, writes audit entry).
- Evidence preview lightbox (signed URLs, image + PDF inline, others as download).
- CSV export of the current filtered view.

## Phase 2 — Moderation, Flags, Reporters
- Dedicated `pending` moderation queue page with keyboard shortcuts (J/K navigate, A approve, R reject, F flag) and reason templates stored in a new `moderation_templates` table.
- Flags triage page: list `report_flags` grouped by report, resolve / dismiss, jump-to-report.
- Reporters database: searchable list of submitters (joined from `profiles` + report counts), filters for verified/blocked, drill-down panel showing their reports, quick verify / block / unblock actions (already permitted by RLS, all changes audited).

## Phase 3 — Audit, Roles, Analytics, Abuse
- Audit log viewer: filterable timeline (actor, action, target, date range) reading `admin_audit_log`, with JSON metadata diff viewer.
- Role management UI: promote / demote admins (gated to super-admin via new `super_admin` role), with confirmation modal and audit entry. Bootstrap promotes `jayjay2999@gmail.com` to `super_admin`.
- Dashboard analytics: reports/week line chart, approval SLA, top countries, top categories, risk breakdown — using `recharts` (already in deps) reading from new SQL views.
- Abuse view: surface `security_events`, blocked accounts list with unblock control, recent captcha/login failures.

## Phase 4 — Notifications & Public SEO
- Admin notifications: in-app bell (new pending high-risk reports + new flags) via realtime subscriptions; optional email digest using existing email infra if configured.
- Public reports SEO: per-report `head()` with title/description/canonical and JSON-LD `Report`/`Organization`-style schema so approved entries are crawlable.

## Technical details
- New tables (migrations, RLS + GRANTs): `moderation_templates`, `admin_notifications`, `app_role` enum gains `super_admin`. Views: `v_admin_dashboard_stats`, `v_reporter_summary`.
- All admin mutations call `log_admin_action` RPC so every change is audited.
- Realtime: subscribe to `reports` (status=pending) and `report_flags` channels from the admin shell to drive notifications.
- Keyboard shortcuts implemented with a small `useHotkeys` hook scoped to the queue page.
- CSV export client-side from current table state (no extra endpoint).
- Evidence signed URLs via existing `evidence` private bucket using `supabase.storage.from('evidence').createSignedUrl(path, 300)`.
- Admin UI restructured into a left sidebar (`shadcn/ui` Sidebar) with sections: Dashboard, Queue, Reports, Reporters, Flags, Notifications, Audit, Roles, Abuse. Keeps existing `/admin` URL; subpages live under `/admin/queue`, `/admin/reporters`, etc.
- Server functions only where needed (role grants, signed URL generation for non-owners). All client reads use the authenticated supabase client + RLS.
- SEO route uses TanStack `head()` reading loader data via the public server fn pattern.

## Out of scope (ask if you want them)
- Email digest delivery (requires email provider setup).
- Two-factor auth for admins.
- Image thumbnails / virus scan on evidence uploads.

Ready to start with Phase 1 once you approve.
