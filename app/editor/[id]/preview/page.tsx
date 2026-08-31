'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExperienceShell } from '@/components/experience/ExperienceShell';
import { Spinner } from '@/components/ui/Spinner';
import type { BirthdayProject, ExperienceData, ProjectMedia } from '@/types';

/**
 * Owner-only live preview (proxy protects /editor/*). Renders the same
 * ExperienceShell as /b/[slug] but reads the draft through the owner's
 * RLS-scoped browser client.
 */
export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ExperienceData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const [{ data: project }, { data: media }] = await Promise.all([
        supabase.from('birthday_projects').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('project_media')
          .select('*')
          .eq('project_id', id)
          .order('sort_order', { ascending: true }),
      ]);
      if (cancelled) return;
      if (!project) {
        setMissing(true);
        return;
      }
      const rows = (media as ProjectMedia[]) ?? [];
      setData({
        project: project as BirthdayProject,
        photos: rows.filter((m) => m.type === 'photo'),
        video: rows.find((m) => m.type === 'video') ?? null,
        music: rows.find((m) => m.type === 'music') ?? null,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (missing) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-500">
        Project not found.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-violet-600">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <ExperienceShell data={data} />;
}
