import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LIMITS, isUuid } from '@/lib/utils/validation';

// POST /api/wishes — anonymous: a friend leaves a wish via /wish/[id].
// The admin client is required because project_wishes has no public INSERT
// policy; this route is the gate (wishes_enabled, length limits, a per-project
// cap, and a honeypot field for naive bots).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const projectId = body?.projectId;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  // Bots fill every field; humans never see this one. Pretend success.
  if (body?.website) return NextResponse.json({ ok: true }, { status: 201 });

  if (!isUuid(projectId)) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }
  if (!name || name.length > LIMITS.wishName) {
    return NextResponse.json(
      { error: `Add your name (up to ${LIMITS.wishName} characters)` },
      { status: 400 }
    );
  }
  if (!message || message.length > LIMITS.wishMessage) {
    return NextResponse.json(
      { error: `Write a wish (up to ${LIMITS.wishMessage} characters)` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from('birthday_projects')
    .select('id, wishes_enabled')
    .eq('id', projectId)
    .maybeSingle();
  if (!project?.wishes_enabled) {
    return NextResponse.json({ error: 'This wish link is closed' }, { status: 404 });
  }

  const { count } = await admin
    .from('project_wishes')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);
  if ((count ?? 0) >= LIMITS.wishesPerProject) {
    return NextResponse.json({ error: 'This card is full of wishes already!' }, { status: 409 });
  }

  const { error } = await admin
    .from('project_wishes')
    .insert({ project_id: projectId, author_name: name, message });
  if (error) return NextResponse.json({ error: 'Could not save your wish' }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
