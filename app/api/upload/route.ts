import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MEDIA_TYPES = ['photo', 'video', 'music'] as const;

// Spec 12.4: the file is already in Storage (browser upload); this inserts the
// project_media row via the admin client after verifying ownership.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { projectId, storagePath, type, caption = '', sortOrder = 0 } = body ?? {};

  if (!projectId || !storagePath || !MEDIA_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  // The storage policies scope uploads to the creator's folder; reject rows
  // pointing at paths the caller doesn't own.
  if (!String(storagePath).startsWith(`${user.id}/${projectId}/`)) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
  }

  // Compare creator_id explicitly. RLS policies are OR'd, so the
  // "Public reads published projects" policy makes a bare select succeed for
  // ANY published project — including someone else's.
  const { data: project } = await supabase
    .from('birthday_projects')
    .select('id, creator_id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = createAdminClient();

  // Music and video are singletons: replace rather than accumulate. Two rows of
  // the same type share sort_order 0, and the published page resolves that tie
  // arbitrarily — so a replaced track could still play for the recipient.
  if (type !== 'photo') {
    const { data: old } = await admin
      .from('project_media')
      .select('id, storage_path')
      .eq('project_id', projectId)
      .eq('type', type);
    if (old?.length) {
      await admin.storage.from('birthday-media').remove(old.map((o) => o.storage_path));
      await admin
        .from('project_media')
        .delete()
        .in(
          'id',
          old.map((o) => o.id)
        );
    }
  }
  const {
    data: { publicUrl },
  } = admin.storage.from('birthday-media').getPublicUrl(storagePath);

  const { data: media, error } = await admin
    .from('project_media')
    .insert({
      project_id: projectId,
      type,
      storage_path: storagePath,
      public_url: publicUrl,
      caption,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ media }, { status: 201 });
}
