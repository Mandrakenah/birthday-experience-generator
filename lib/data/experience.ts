import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { BirthdayProject, ExperienceData, ProjectMedia, ProjectWish } from '@/types';

/**
 * The published project behind a /b/[slug] link, or null. Wrapped in
 * React.cache so generateMetadata and the page share one query per request.
 */
export const getPublishedProject = cache(async (slug: string): Promise<BirthdayProject | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('birthday_projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return (data as BirthdayProject | null) ?? null;
});

/** Everything the experience plays. Only call once the reveal time has passed. */
export async function getExperienceData(project: BirthdayProject): Promise<ExperienceData> {
  const supabase = await createClient();
  const [{ data: media }, { data: wishes }] = await Promise.all([
    supabase
      .from('project_media')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true }),
    // project_wishes only exists once migration 0004 (which also adds
    // wishes_enabled) has run; any error just means no wishes scene.
    project.wishes_enabled === undefined
      ? Promise.resolve({ data: [] })
      : supabase
          .from('project_wishes')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true }),
  ]);

  const rows = (media as ProjectMedia[] | null) ?? [];
  return {
    project,
    photos: rows.filter((m) => m.type === 'photo'),
    video: rows.find((m) => m.type === 'video') ?? null,
    music: rows.find((m) => m.type === 'music') ?? null,
    wishes: (wishes as ProjectWish[] | null) ?? [],
  };
}
