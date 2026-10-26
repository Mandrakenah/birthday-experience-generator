'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Fire-and-forget view record into experience_views (schema Section 7; an
 * RLS policy allows the anonymous insert for published projects). The
 * dashboard shows the resulting count on each card. Renders nothing.
 */
export function RecordView({ projectId }: { projectId: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; guard against a duplicate row.
    if (recorded.current) return;
    recorded.current = true;

    // One view per browser session, so refreshes don't inflate the count.
    const key = `bday-viewed-${projectId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage blocked — count it anyway.
    }

    const supabase = createClient();
    void supabase
      .from('experience_views')
      .insert({ project_id: projectId, user_agent: navigator.userAgent })
      .then(() => {
        // Best-effort analytics — ignore failures so they never break the experience.
      });
  }, [projectId]);

  return null;
}
