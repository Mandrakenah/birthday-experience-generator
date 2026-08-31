'use client';

import { Button } from '@/components/ui/Button';

/** Opens /editor/[id]/preview in a new tab (spec 5.1). */
export function PreviewButton({ projectId }: { projectId: string }) {
  return (
    <Button
      variant="secondary"
      onClick={() => window.open(`/editor/${projectId}/preview`, '_blank')}
    >
      Preview ↗
    </Button>
  );
}
