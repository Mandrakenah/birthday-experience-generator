'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { LIMITS } from '@/lib/utils/validation';
import { ChevronDownIcon, ChevronUpIcon, XIcon } from '@/components/ui/icons';
import type { ProjectMedia } from '@/types';

interface PhotoReorderProps {
  photos: ProjectMedia[];
  onReorder: (photos: ProjectMedia[]) => void;
  onCaptionSaved: (id: string, caption: string) => void;
  onRemove: (photo: ProjectMedia) => Promise<string | null>;
}

/**
 * Photo list with captions. Reorder by dragging (desktop) or the arrow buttons
 * (touch — HTML5 drag-and-drop never fires there). sort_order and captions
 * persist straight through the browser client; RLS restricts writes to the
 * project owner.
 */
export function PhotoReorder({ photos, onReorder, onCaptionSaved, onRemove }: PhotoReorderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function persistOrder(next: ProjectMedia[], previous: ProjectMedia[]) {
    const supabase = createClient();
    // Only rows whose position actually changed.
    const changed = next.filter((p) => previous.find((o) => o.id === p.id)?.sort_order !== p.sort_order);
    const results = await Promise.all(
      changed.map((photo) =>
        supabase.from('project_media').update({ sort_order: photo.sort_order }).eq('id', photo.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setError(failed.error.message);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const renumbered = next.map((p, i) => ({ ...p, sort_order: i }));
    setError(null);
    onReorder(renumbered);
    void persistOrder(renumbered, photos);
  }

  async function saveCaption(photo: ProjectMedia, caption: string) {
    const trimmed = caption.trim().slice(0, LIMITS.caption);
    if (trimmed === photo.caption) return;
    const { error: dbError } = await createClient()
      .from('project_media')
      .update({ caption: trimmed })
      .eq('id', photo.id);
    if (dbError) setError(dbError.message);
    else onCaptionSaved(photo.id, trimmed);
  }

  async function handleRemove(photo: ProjectMedia) {
    setError(null);
    const message = await onRemove(photo);
    if (message) setError(message);
  }

  if (photos.length === 0) {
    return <p className="text-sm text-gray-400">No photos uploaded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((o) => (o === index ? null : o))}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl border-2 bg-white p-2',
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? 'border-violet-500'
                : 'border-gray-200',
              dragIndex === index && 'opacity-50'
            )}
          >
            <div className="relative size-16 shrink-0 cursor-grab overflow-hidden rounded-lg active:cursor-grabbing">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase host varies per env */}
              <img
                src={photo.public_url}
                alt={photo.caption || `Photo ${index + 1}`}
                className="size-full object-cover"
                draggable={false}
              />
              <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 text-xs text-white">
                {index + 1}
              </span>
            </div>

            <input
              type="text"
              defaultValue={photo.caption}
              maxLength={LIMITS.caption}
              placeholder="Add a caption (optional)"
              aria-label={`Caption for photo ${index + 1}`}
              onBlur={(e) => void saveCaption(photo, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />

            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                aria-label="Move earlier"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                className="flex size-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronUpIcon className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Move later"
                disabled={index === photos.length - 1}
                onClick={() => move(index, index + 1)}
                className="flex size-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronDownIcon className="size-4" />
              </button>
            </div>
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => void handleRemove(photo)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <XIcon className="size-4" />
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-gray-400">
        Drag photos or use the arrows to change their order. Captions show on the slideshow.
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
