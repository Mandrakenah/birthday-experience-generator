'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Fire-and-forget view record into experience_views (schema Section 7;
 * "Anyone records views" RLS policy allows the anonymous insert). The
 * analytics dashboard that reads these is post-MVP (Section 23) — this just
 * captures the data. Renders nothing.
 */
export function RecordView({ projectId }: { projectId: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; guard against a duplicate row.
    if (recorded.current) return;
    recorded.current = true;

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
