# Security

This document describes the security model of the Birthday Experience Generator and the
results of a security pass.

## Trust model

There are two audiences:

- **Creators** (authenticated) build projects in `/dashboard` and `/editor/*`.
- **Recipients** (anonymous) view a published experience at `/b/[slug]` — no login.

Defense is **layered**, with the database as the real boundary:

1. **Row Level Security (RLS) is the enforcement.** Policies in
   `supabase/migrations/0001_schema.sql`:
   - Creators can only read/write rows where `auth.uid() = creator_id`.
   - Anyone can read a `birthday_projects` row only when `status = 'published'`, and its
     `project_media` only when the parent project is published.
   - Storage policies scope uploads/deletes to the user's own folder
     (`{auth_user_id}/...`) and allow public reads of `birthday-media`.
2. **Route protection (`proxy.ts`)** redirects unauthenticated visitors away from
   `/dashboard` and `/editor` to `/login`. This is convenience, not the boundary — RLS
   still applies even if the proxy is bypassed.
3. **API routes** (`/api/*`) re-check `supabase.auth.getUser()` and operate through the
   user-scoped client wherever possible, so RLS applies to their queries too.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is **server-only**. It is referenced solely
  in `lib/supabase/admin.ts`, which is imported only by `/api/{upload,publish,slug}`
  route handlers — never by client components. Verified by grep.
- Only `NEXT_PUBLIC_*` values reach the browser (the anon URL + anon key, which are safe
  to expose by design).
- `.env.local` is gitignored (`.env*`, with `!.env.example`). `.env.example` holds empty
  placeholders only. **Never commit real keys.**

## Where the service-role (admin) client is used, and why

- `/api/upload` — inserts the `project_media` row after verifying the caller owns the
  project (user-scoped check) **and** that the storage path begins with
  `{user.id}/{projectId}/`, rejecting writes that point at another user's folder.
- `/api/publish` — verifies `project.creator_id === user.id` before flipping status /
  assigning a slug.
- `/api/slug` — availability check only; needs to see all users' slugs (which RLS hides
  from a normal client), returns just a boolean.

## Input handling / XSS

- All user text (messages, recipient name, captions) is rendered as React children and is
  therefore HTML-escaped. There is **no `dangerouslySetInnerHTML` and no `eval`** anywhere
  (verified by grep).
- The **custom theme** (`custom_theme` JSONB) is owner-controlled and rendered to
  recipients. Colors are applied via React `style` objects (single CSS property values —
  cannot inject new CSS rules), and the background image is rendered via an `<img>` `src`
  (image URLs do not execute script). `CustomStickers` defensively ignores a malformed
  blob (non-array, or unknown sticker kind) so a bad value cannot crash a recipient's
  page. Because RLS limits writes to the project owner, the worst case is a creator
  affecting only their own experience — there is no cross-user write path.

## Dependency advisories

`npm audit` reports **2 moderate** advisories, both from `postcss` pulled in transitively
by `next`. PostCSS runs at **build time** (compiling CSS), not in the deployed runtime,
and this project does not process untrusted CSS, so it is not runtime-exploitable here.

The only automated remedy (`npm audit fix --force`) upgrades `next` off the pinned
`16.2.9`, which would risk breaking the intentionally-pinned Next 16 / React 19 / Tailwind
4 stack (see `SPEC_PATCHES.md`). It is therefore **deferred**, not applied. Re-evaluate
when bumping Next deliberately.

## Recommendations for production

- Keep Supabase **email confirmation** decisions in mind: the MVP disables it for
  convenience (spec 10.1). Re-enable for production to prevent signup abuse.
- Consider rate-limiting `/api/*` (e.g. via Vercel/edge) to limit project/slug spam.
- Rotate the service-role key if it is ever exposed.
- Set a strong Supabase database password and restrict the project's allowed redirect URLs.

## Reporting

This is a personal/educational project. To report an issue, contact the repository owner
directly.
