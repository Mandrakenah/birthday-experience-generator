'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { copyText } from '@/lib/utils/clipboard';
import { Button } from '@/components/ui/Button';
import { XIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import type { ProjectWish } from '@/types';

interface WishesManagerProps {
  projectId: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const fetchWishes = (projectId: string) =>
  createClient()
    .from('project_wishes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

/**
 * Friends' wishes: an invite link (/wish/[id]) others use to leave a short
 * message, plus moderation of what came in. Wishes play as their own scene.
 */
export function WishesManager({ projectId, enabled, onToggle }: WishesManagerProps) {
  const [wishes, setWishes] = useState<ProjectWish[]>([]);
  const [copied, setCopied] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchWishes(projectId).then(({ data }) => {
      if (!cancelled && data) setWishes(data as ProjectWish[]);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function refresh() {
    setError(null);
    const { data, error: loadError } = await fetchWishes(projectId);
    if (loadError) setError(loadError.message);
    else setWishes(data as ProjectWish[]);
  }

  async function remove(id: string) {
    setError(null);
    const { error: deleteError } = await createClient()
      .from('project_wishes')
      .delete()
      .eq('id', id);
    if (deleteError) setError(deleteError.message);
    else setWishes((w) => w.filter((x) => x.id !== id));
  }

  async function copyLink() {
    setCopied(await copyText(`${window.location.origin}/wish/${projectId}`));
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Wishes from friends</p>
          <p className="text-xs text-gray-500">
            Invite others to add a short message. They appear as their own scene.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Collect wishes from friends"
          onClick={() => onToggle(!enabled)}
          className={cn(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors',
            enabled ? 'bg-violet-600' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-6 rounded-full bg-white shadow transition-all',
              enabled ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void copyLink()} className="flex-1">
            {copied === true ? 'Invite link copied!' : copied === false ? 'Copy failed' : 'Copy invite link'}
          </Button>
          <Button variant="ghost" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
      )}

      {wishes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {wishes.map((wish) => (
            <li
              key={wish.id}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{wish.message}</p>
                <p className="mt-1 text-xs font-medium text-gray-500">— {wish.author_name}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove wish from ${wish.author_name}`}
                onClick={() => void remove(wish.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <XIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {enabled && wishes.length === 0 && (
        <p className="text-xs text-gray-400">No wishes yet — share the invite link.</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
