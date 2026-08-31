# SPEC_PATCHES.md — Authoritative stack-divergence reference

The build follows `Birthday_Experience_Generator_Spec.docx` **except** where the docx
conflicts with the actual installed stack. **When the docx and this file disagree, this
file wins.**

## Why this file exists

The spec was written against **Next.js 14 + React 18 + Tailwind v3**, but
`create-next-app@latest` installed a newer stack. We are deliberately keeping the modern
stack and translating the spec's outdated code blocks as we implement them.

### Actual installed stack (source of truth: `package.json`)

| Package                 | Spec assumed | Installed   |
| ----------------------- | ------------ | ----------- |
| next                    | 14           | **16.2.9**  |
| react / react-dom       | 18           | **19.2.4**  |
| tailwindcss             | 3            | **^4**      |
| @tailwindcss/postcss    | (n/a in v3)  | **^4**      |
| @supabase/ssr           | —            | **^0.12.0** |
| @supabase/supabase-js   | —            | **^2.108.1**|
| framer-motion           | —            | **^12.40.0**|

### Structural divergences from Section 4 (folder structure)

- **`tailwind.config.ts` does not exist.** Tailwind v4 is configured entirely in CSS
  (`app/globals.css`). See Patch 4.
- **`next.config.ts`**, not `next.config.js`. The scaffold emits a TypeScript config and
  Next 16 supports it natively; kept as-is for type safety. Functionally identical to the
  `next.config.js` the spec lists.
- `postcss.config.mjs` and `eslint.config.mjs` (ESLint 9 flat config) are scaffold
  defaults and are kept.
- `AGENTS.md` / `CLAUDE.md` were emitted by the scaffold and are kept (they point at the
  bundled Next 16 docs under `node_modules/next/dist/docs/`).
- **`supabase/` folder added** (not in Section 4). Holds the Section 7 SQL as committed
  migration files plus `SETUP.md` (the Day 2 manual dashboard checklist). The spec only
  says "paste into the SQL Editor"; committing the SQL keeps it in version control.
- **`middleware.ts` is now `proxy.ts`.** Next 16 deprecated the middleware file
  convention. See Patch 5.

Everything else in Section 4 (exact folder names, exact file names) is honored unchanged.

---

## Patch 1 — Section 8.2 · `lib/supabase/server.ts`

**What changed:** In Next 15+, `cookies()` is **async** and `@supabase/ssr` switched the
cookie adapter from `get/set/remove` to **`getAll/setAll`**. `createClient()` therefore
becomes an **async function** — see the ripple-effect note below.

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware
            // refreshes the session (it does, see Patch 2).
          }
        },
      },
    }
  );
}
```

### ⚠️ Ripple effect — `createClient()` is now async everywhere

Every server-side call site must **`await`** it. The spec shows synchronous calls in
several places; all of these become `const supabase = await createClient();`:

- `app/b/[slug]/page.tsx` (Section 17.1 — see Patch 3)
- `app/api/publish/route.ts` (Section 16.2)
- `app/api/projects/route.ts`, `app/api/upload/route.ts`, `app/api/slug/route.ts`
- every server component / route handler that reads the session

The **browser** client (`lib/supabase/client.ts`, Section 8.1) and the **admin** client
(`lib/supabase/admin.ts`, Section 8.3) are **unchanged** — they don't touch `cookies()`.

---

## Patch 2 — Section 9 · `middleware.ts`

**What changed:** Same `getAll/setAll` adapter. The response object must be rebuilt when
cookies are written so refreshed-session cookies reach the browser. Auth-protection logic
(`/dashboard`, `/editor`) and the `matcher` config are unchanged from the spec.

> **Superseded in part by Patch 5:** the file is named `proxy.ts` and the function
> `proxy` — the body below is otherwise what shipped.

```ts
// middleware.ts  (project root, NOT inside app/)
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = ['/dashboard', '/editor'];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## Patch 3 — Section 17.1 · `app/b/[slug]/page.tsx` (data fetching)

**What changed:** (1) dynamic route `params` is now a **`Promise`** — type it as
`Promise<{ slug: string }>` and `await` it; (2) `createClient()` is now async (Patch 1).
The query logic, `notFound()` behavior, and `ExperienceData` shaping are unchanged.

> Apply the same `params: Promise<…>` + `await params` fix to **every** dynamic route:
> `/b/[slug]`, `/editor/[id]`, `/editor/[id]/preview`, and any dynamic API segments.

```ts
// app/b/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ExperienceShell } from '@/components/experience/ExperienceShell';
import type { ExperienceData, ProjectMedia } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('birthday_projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!project) notFound();

  const { data: media } = await supabase
    .from('project_media')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true });

  const photos = (media ?? []).filter((m: ProjectMedia) => m.type === 'photo');
  const video = (media ?? []).find((m: ProjectMedia) => m.type === 'video') ?? null;
  const music = (media ?? []).find((m: ProjectMedia) => m.type === 'music') ?? null;

  const data: ExperienceData = { project, photos, video, music };

  return <ExperienceShell data={data} />;
}
```

> Note: Next 16 also offers a typed helper `PageProps<'/b/[slug]'>` for the props type.
> We use the explicit `Promise<{ slug: string }>` form for clarity and portability.

---

## Patch 4 — Tailwind v4 setup (replaces the Section 4 / Section 0 Tailwind v3 config)

**The spec's Tailwind model does not apply.** There is **no `tailwind.config.ts`** and the
`@tailwind base/components/utilities` directives are gone. Tailwind v4 is CSS-first:

- **PostCSS:** `postcss.config.mjs` uses the `@tailwindcss/postcss` plugin (scaffold default).
- **Entry:** `app/globals.css` begins with a single import instead of three directives:

  ```css
  @import "tailwindcss";
  ```

- **Theme tokens / design system:** defined in CSS via `@theme`, not a JS config file. The
  5 birthday themes (Section 18) still use plain utility classes
  (`bg-gradient-to-br from-pink-100 …`), which work identically in v4. Any project-specific
  design tokens (custom colors, fonts) we add later go inside an `@theme { … }` block in
  `globals.css`, e.g.:

  ```css
  @theme {
    --font-script: "Dancing Script", cursive;   /* example custom token */
  }
  ```

- **Content scanning** is automatic in v4 (no `content: [...]` array to maintain).

Section 18's `lib/utils/themes.ts` `ThemeConfig` objects are **unchanged** — they emit
utility-class strings that v4 supports as-is.

---

## Patch 5 — Section 9 · `middleware.ts` → `proxy.ts` (Next 16 rename)

**What changed:** Next 16 deprecated the `middleware` file convention and renamed it to
`proxy` (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).

- File: `proxy.ts` at the project root (same location the spec gives for `middleware.ts`).
- Export: a function named **`proxy`** (the named export `middleware` is deprecated).
- Runtime: Node.js, **not configurable** — setting a `runtime` config in the proxy file
  throws. (Fine for us: `@supabase/ssr` works on the Node runtime.)
- The body is Patch 2 unchanged — `getAll/setAll` cookie adapter, `/dashboard` + `/editor`
  protection, same `matcher`.

---

## Patch 6 — `params` in client-component pages (`/editor/[id]`, `/editor/[id]/preview`)

**What changed:** Patch 3 unwraps the route `params` Promise with `await` — that only
works in **server** components. The editor and its preview are **client** components
(`'use client'`) because they hold interactive state, so they cannot `await`. Instead they
unwrap the Promise with React 19's **`use()`** hook:

```tsx
'use client';
import { use } from 'react';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // …
}
```

The public `/b/[slug]` page stays a server component and uses `await` (Patch 3). The rule:
**server component → `await params`; client component → `use(params)`.**

---

## Running list of section-by-section translations

Update this list as each day's section is reached and checked.

| Spec section | Status | Note |
| ------------ | ------ | ---- |
| 8.2 server.ts | patched | async cookies + getAll/setAll (Patch 1) |
| 9 middleware.ts | patched | getAll/setAll (Patch 2) + renamed to proxy.ts (Patch 5) |
| 17.1 b/[slug] page | patched | params Promise + await createClient (Patch 3) |
| Tailwind config | patched | v4 CSS-first (Patch 4) |
| 12.1 dashboard | done (Day 5) | client-component page so logout/new-project handlers stay in page.tsx (Section 5 lists no dashboard components besides ProjectCard) |
| 16.2 publish route | done (Day 10) | `await createClient()`; added `publish:false` branch so PublishToggle can revert to draft (keeps slug) |
| editor/[id], editor/[id]/preview | done (Day 6) | client components — unwrap `params` with React 19 `use(params)`, not `await` (Patch 6) |
| 12.4 upload flow | done (Day 7) | supabase-js v2 has no byte-progress callback → per-file status, not a percentage bar |
| 8.x useAudio | done (Day 16) | hook is stateless (refs only) to satisfy Next 16 `react-hooks/set-state-in-effect` |
| 14.5 TypewriterText | done (Day 14) | inlined into MessageScene + `onComplete` callback to gate the Continue button |
| Tailwind font-script | done (Day 9) | `--font-script` `@theme` token in globals.css backs `font_family:'script'` (extends Patch 4) |
| 13.3 useMicrophone | done (Day 19) | refs fine on React 19; added `AudioContext.resume()` + `isMicrophoneSupported()` guard. Real-iPhone test still pending |
| 15 Fireworks | done (Day 20) | verbatim from spec; burst setTimeouts now cleared on unmount |
| 5.4 useExperienceState | done (Day 11) | sessionStorage restore via queueMicrotask to avoid hydration mismatch |
| 20 error handling | done | added app/{error,global-error,loading,not-found}.tsx route boundaries (beyond Section 4 inventory) |
| 7 experience_views | done | RecordView client component fires a best-effort view insert on /b/[slug]; analytics dashboard stays post-MVP (Section 23) |
| 18 themes | extended | added 6th theme `sweetheart` (rose/pink, floating hearts via FloatingHearts) at user request — spec listed 5. DB `theme` is free TEXT so no migration needed; ThemeName union updated. Cake SVG extracted to CakeBody (shared by CakeScene + landing PhonePreview) |
| 18 themes — custom builder | extended | added 7th theme `custom`: full page builder (own colors, bg photo + opacity, text styling, drag-placed preset stickers — teddy/heart/star/etc). New `custom_theme JSONB` column (migration 0003); CustomTheme type + DEFAULT_CUSTOM_THEME; CustomThemeEditor (drag via pointer-capture), Stickers library, CustomStickers overlay; ExperienceShell renders inline styles when theme==='custom'. `themes` record retyped to PresetThemeName (excludes custom). NOTE: bg-photo upload is local-preview only until Supabase Storage is wired |
