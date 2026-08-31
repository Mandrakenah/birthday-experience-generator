// app/b/[slug]/page.tsx — public experience viewer (spec 17.1, Patch 3)
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ExperienceShell } from '@/components/experience/ExperienceShell';
import { RecordView } from '@/components/experience/RecordView';
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

  return (
    <>
      <RecordView projectId={project.id} />
      <ExperienceShell data={data} />
    </>
  );
}
