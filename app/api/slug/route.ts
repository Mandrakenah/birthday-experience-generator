import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/slug?slug=foo → { available: boolean } (spec 6.1, auth required).
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = new URL(request.url).searchParams.get('slug')?.trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  // Admin client: availability must consider every user's slugs, which RLS
  // would hide from the caller.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('birthday_projects')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ slug, available: !data });
}
