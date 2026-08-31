'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface PublishToggleProps {
  projectId: string;
  isPublished: boolean;
  /** Spec 12.2: enabled only with ≥1 photo + recipient name set. */
  canPublish: boolean;
  onPublished: (slug: string, url: string) => void;
  onUnpublished: () => void;
}

/** Toggle that calls /api/publish to flip draft ↔ published (spec 5.1). */
export function PublishToggle({
  projectId,
  isPublished,
  canPublish,
  onPublished,
  onUnpublished,
}: PublishToggleProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, publish: !isPublished }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong');
      return;
    }
    if (json.status === 'published') onPublished(json.slug, json.url);
    else onUnpublished();
  }

  const disabled = busy || (!isPublished && !canPublish);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isPublished ? 'Published' : 'Draft'}
          </p>
          <p className="text-xs text-gray-500">
            {isPublished
              ? 'Anyone with the link can view it.'
              : canPublish
                ? 'Publish to get a shareable link.'
                : 'Add a recipient name and at least one photo to publish.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublished}
          aria-label="Publish"
          disabled={disabled}
          onClick={() => void handleToggle()}
          className={cn(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
            isPublished ? 'bg-green-500' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-6 rounded-full bg-white shadow transition-all',
              isPublished ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
