import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/utils/validation';

// Landing point for every emailed auth link (signup confirmation, password
// reset). Supabase's default templates send a PKCE `code`; custom templates
// that link with `token_hash` + `type` are handled too. Either way the session
// cookie is set here, then the user continues to `next`.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get('next'));
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('Missing code') };

  if (error) return NextResponse.redirect(`${origin}/login?error=link`);
  return NextResponse.redirect(`${origin}${next}`);
}
