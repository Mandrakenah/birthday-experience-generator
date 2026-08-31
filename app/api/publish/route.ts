import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlug } from '@/lib/utils/slugGenerator';

// Spec 16.2 (+ Patch 1: await createClient). `publish: false` flips back to
// draft — the spec's PublishToggle needs both directions; the slug is kept so
// re-publishing restores the same link.
export async function POST(request: Request) {
  const { projectId, publish = true } = await request.json();

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
    .single();

  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = createAdminClient();

  if (!publish) {
    const { error } = await admin
      .from('birthday_projects')
      .update({ status: 'draft' })
      .eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slug: project.slug, status: 'draft' });
  }

  // Reuse existing slug if already published, else generate a unique one
  let slug = project.slug;
  if (!slug) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateSlug(project.recipient);
      const { data: collision } = await admin
        .from('birthday_projects')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!collision) {
        slug = candidate;
        break;
      }
    }
  }

  if (!slug) {
    return NextResponse.json({ error: 'Could not generate slug' }, { status: 500 });
  }

  const { error } = await admin
    .from('birthday_projects')
    .update({ slug, status: 'published' })
    .eq('id', projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    slug,
    status: 'published',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/b/${slug}`,
  });
}
