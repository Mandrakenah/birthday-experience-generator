import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlug } from '@/lib/utils/slugGenerator';
import { isUuid } from '@/lib/utils/validation';

// Spec 16.2 (+ Patch 1: await createClient). `publish: false` flips back to
// draft — the spec's PublishToggle needs both directions; the slug is kept so
// re-publishing restores the same link.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const projectId = body?.projectId;
  const publish = body?.publish !== false;
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: project } = await supabase
    .from('birthday_projects')
    .select('id, recipient, creator_id, slug')
    .eq('id', projectId)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = createAdminClient();

  if (!publish) {
    const { error } = await admin
      .from('birthday_projects')
      .update({ status: 'draft' })
      .eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slug: project.slug, status: 'draft' });
  }

  // Same rule the editor shows (spec 12.2), enforced here too.
  const { count: photoCount } = await supabase
    .from('project_media')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('type', 'photo');
  if (!project.recipient.trim() || !photoCount) {
    return NextResponse.json(
      { error: 'Add a recipient name and at least one photo first' },
      { status: 400 }
    );
  }

  // Reuse the existing slug, else claim a fresh one. The UNIQUE constraint is
  // the real arbiter, so a concurrent publish that grabs the same candidate
  // just makes this loop try again.
  let slug: string | null = project.slug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = slug ?? generateSlug(project.recipient);
    const { error } = await admin
      .from('birthday_projects')
      .update({ slug: candidate, status: 'published' })
      .eq('id', projectId);
    if (!error) {
      slug = candidate;
      break;
    }
    if (error.code !== '23505' || project.slug) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    slug = null;
  }

  if (!slug) {
    return NextResponse.json({ error: 'Could not generate a link — try again' }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return NextResponse.json({ slug, status: 'published', url: `${origin}/b/${slug}` });
}
