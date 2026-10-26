# Security

This document describes the security model of the Birthday Experience Generator and the
results of the security passes.

## Trust model

There are three audiences:

- **Creators** (authenticated) build projects in `/dashboard` and `/editor/*`.
- **Recipients** (anonymous) view a published experience at `/b/[slug]` — no login.
- **Contributors** (anonymous) leave a wish at `/wish/[id]` when the creator enables it.

Defense is **layered**, with the database as the real boundary:

1. **Row Level Security (RLS) is the enforcement.** Policies in `supabase/migrations/`:
   - Creators can only read/write rows where `auth.uid() = creator_id`.
   - Anyone can read a `birthday_projects` row only when `status = 'published'`, and its
     `project_media` / `project_wishes` only when the parent project is published.
   - `experience_views` accepts anonymous inserts only for published projects (0004).
   - `project_wishes` has **no** public INSERT policy; wishes go through `/api/wishes`.
   - Storage policies scope uploads/deletes to the user's own folder
     (`{auth_user_id}/...`) and allow public reads of `birthday-media`.
2. **Route protection (`proxy.ts`)** redirects unauthenticated visitors away from
   `/dashboard` and `/editor` to `/login?next=…`. This is convenience, not the boundary.
3. **API routes** re-check `supabase.auth.getUser()`, validate every input, and operate
   through the user-scoped client wherever possible, so RLS applies to their queries too.

### ⚠️ RLS policies are OR'd

`Public reads published projects` sits alongside the owner policy, so a bare
`select()` on `birthday_projects` returns **every user's published rows** to any
caller. Every owner-facing query (dashboard, editor, API routes) therefore also filters
`.eq('creator_id', user.id)`. The dashboard previously missed this and listed strangers'
published cards; the e2e suite now checks the dashboard UI, not just the API.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is **server-only**. It is referenced solely
  in `lib/supabase/admin.ts`, which is imported only by server code: `/api/{upload,
  publish,wishes}` and the `/wish/[id]` server page — never by client components.
- Only `NEXT_PUBLIC_*` values reach the browser (the anon URL + anon key, which are safe
  to expose by design).
- `.env.local` is gitignored (`.env*`, with `!.env.example`). **Never commit real keys.**

## Where the service-role (admin) client is used, and why

- `/api/upload` — inserts the `project_media` row after verifying the caller owns the
  project **and** that the storage path is exactly `{user.id}/{projectId}/{type}/{file}`.
- `/api/publish` — verifies ownership (and that there's a name + photo) before flipping
  status / claiming a slug; the slug's UNIQUE constraint resolves races.
- `/api/wishes` — inserts a wish only if the project has `wishes_enabled`, with length
  limits, a 200-per-project cap, and a honeypot field.
- `/wish/[id]` — reads the recipient name/theme of a possibly-unpublished project, and
  only while wishes are enabled.

## Input handling / XSS

- All user text (messages, names, captions, wishes) is rendered as React children and is
  therefore HTML-escaped. There is **no `dangerouslySetInnerHTML` and no `eval`**.
- `PATCH /api/projects` validates every field (`lib/utils/validation.ts`): known theme and
  font names only, length limits, a real date for `reveal_at`, 1–10 candles.
- **Custom theme (`custom_theme` JSONB) is sanitized on write and again on render.**
  Its colors are interpolated into a CSS `linear-gradient(...)`, so before this pass a
  value like `red), url(https://tracker/…)` would have made every recipient's browser
  request an attacker-chosen URL (leaking IPs). Colors must now be `#rrggbb`, the
  background image must be a file in this project's own `birthday-media` bucket, and
  stickers must be known kinds with clamped positions. Rows saved before the fix are
  sanitized when rendered.
- `?next=` redirects only accept same-origin relative paths (no `//host` open redirects).

## Privacy

- `/b/*` and `/wish/*` send `noindex` and are disallowed in `robots.txt`.
- Link-preview metadata and the Open Graph image show only the recipient's name.
- With a scheduled reveal, the server renders only the countdown — photos, messages and
  wishes are not sent to the browser until the reveal time.
- Deleting a project deletes its Storage files, not just the rows.

## HTTP headers

Set for every route in `next.config.ts`: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (the
editor frames its own preview), `Permissions-Policy` (microphone only for self; no camera
or geolocation), and HSTS. `X-Powered-By` is off.

## Dependency advisories

`npm audit` reports moderate advisories from `postcss` pulled in transitively by `next`.
PostCSS runs at **build time**, not in the deployed runtime, and this project does not
process untrusted CSS. The automated fix forces `next` off the pinned `16.2.9`, so it is
deferred. Re-evaluate when bumping Next deliberately.

## Recommendations for production

- Turn **Confirm email** on in Supabase (the app supports it) to deter signup abuse.
- Set the Supabase **Site URL** and **Redirect URLs** to the production origin
  (see `supabase/SETUP.md`) so confirmation and reset emails land in the right place.
- Consider rate-limiting `/api/*` (e.g. Vercel Firewall rules), especially `/api/wishes`.
- Rotate the service-role key if it is ever exposed.

## Reporting

This is a personal/educational project. To report an issue, contact the repository owner
directly.
