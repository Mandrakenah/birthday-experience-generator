// proxy.ts (project root, NOT inside app/)
// SPEC_PATCHES Patch 2 body + Patch 5 rename: Next 16 deprecated the
// `middleware` file convention in favour of `proxy`. Runtime is Node.js and is
// not configurable here, which suits @supabase/ssr.
//
// This is what refreshes the auth session and writes the rotated cookies back
// to the browser. Server Components cannot set cookies, so without this file
// lib/supabase/server.ts silently discards every refreshed token.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // The response must be rebuilt so refreshed cookies reach the browser.
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

  const { pathname, search } = request.nextUrl;

  // A redirect is a new response, so the refreshed session cookies written to
  // supabaseResponse must be copied across or the rotation is lost.
  const redirect = (path: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = next ? `?next=${encodeURIComponent(next)}` : '';
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const protectedPaths = ['/dashboard', '/editor'];
  if (!user && protectedPaths.some((p) => pathname.startsWith(p))) {
    return redirect('/login', pathname + search);
  }

  // Already signed in — the auth forms have nothing to offer.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return redirect('/dashboard');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
