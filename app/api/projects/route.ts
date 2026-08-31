import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BirthdayProject } from '@/types';

// Fields a creator may change through this route. slug/status are managed
// exclusively by /api/publish.
const UPDATABLE_FIELDS = [
  'recipient',
  'theme',
  'message',
  'final_message',
  'font_family',
  'custom_theme',
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('birthday_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ projects: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const recipient =
    typeof body.recipient === 'string' && body.recipient.trim()
      ? body.recipient.trim()
      : ((user.user_metadata?.default_recipient as string | undefined) ?? '');

  const { data, error } = await supabase
    .from('birthday_projects')
    .insert({ creator_id: user.id, recipient })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  const updates: Partial<BirthdayProject> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  // User-scoped client: RLS guarantees only the owner's row can match.
  const { data, error } = await supabase
    .from('birthday_projects')
    .update(updates)
    .eq('id', body.id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ project: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('birthday_projects')
    .delete()
    .eq('id', body.id)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ deleted: data.id });
}
