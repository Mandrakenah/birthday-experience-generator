import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LIMITS, isUuid, parseProjectUpdate } from '@/lib/utils/validation';
import type { MediaType } from '@/types';

const MEDIA_FOLDERS: MediaType[] = ['photo', 'video', 'music'];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Filter by creator_id explicitly. RLS policies are OR'd, so the
  // "Public reads published projects" policy would otherwise make this return
  // every user's published projects — strangers' pages in your dashboard.
  const { data, error } = await supabase
    .from('birthday_projects')
    .select('*')
    .eq('creator_id', user.id)
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
  const fallback = user.user_metadata?.default_recipient;
  const recipient = (
    typeof body.recipient === 'string' && body.recipient.trim()
      ? body.recipient.trim()
      : typeof fallback === 'string'
        ? fallback
        : ''
  ).slice(0, LIMITS.recipient);

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
  if (!body || typeof body !== 'object' || !isUuid(body.id)) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  // slug/status are managed exclusively by /api/publish and are not accepted here.
  const parsed = parseProjectUpdate(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // creator_id filter + RLS: only the owner's row can match.
  const { data, error } = await supabase
    .from('birthday_projects')
    .update(parsed.updates)
    .eq('id', body.id)
    .eq('creator_id', user.id)
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
  if (!isUuid(body?.id)) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('birthday_projects')
    .delete()
    .eq('id', body.id)
    .eq('creator_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // The rows cascade, but Storage objects don't. Best-effort: a failure here
  // only leaves orphaned files, never a broken project.
  const bucket = supabase.storage.from('birthday-media');
  await Promise.all(
    MEDIA_FOLDERS.map(async (type) => {
      const folder = `${user.id}/${data.id}/${type}`;
      const { data: files } = await bucket.list(folder, { limit: 1000 });
      if (files?.length) await bucket.remove(files.map((f) => `${folder}/${f.name}`));
    })
  );

  return NextResponse.json({ deleted: data.id });
}
