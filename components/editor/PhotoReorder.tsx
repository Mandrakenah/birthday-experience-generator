'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import type { ProjectMedia } from '@/types';

interface PhotoReorderProps {
  photos: ProjectMedia[];
  onReorder: (photos: ProjectMedia[]) => void;
  onRemoved: (id: string) => void;
}

/**
 * HTML5 drag-and-drop grid (no third-party DnD — stack is locked, spec 1.6).
 * sort_order persists straight through the browser client; RLS restricts
 * writes to the project owner.
 */
export function PhotoReorder({ photos, onReorder, onRemoved }: PhotoReorderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function persistOrder(next: ProjectMedia[]) {
    const supabase = createClient();
    const results = await Promise.all(
      next.map((photo, i) =>
        supabase.from('project_media').update({ sort_order: i }).eq('id', photo.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setError(failed.error.message);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...photos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const renumbered = next.map((p, i) => ({ ...p, sort_order: i }));
    setDragIndex(null);
    setOverIndex(null);
    setError(null);
    onReorder(renumbered);
    void persistOrder(renumbered);
  }

  async function handleRemove(photo: ProjectMedia) {
    setError(null);
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from('project_media')
      .delete()
      .eq('id', photo.id);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    await supabase.storage.from('birthday-media').remove([photo.storage_path]);
    onRemoved(photo.id);
  }

  if (photos.length === 0) {
    return <p className="text-sm text-gray-400">No photos uploaded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((o) => (o === index ? null : o))}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              'group relative aspect-square cursor-grab overflow-hidden rounded-lg border-2 active:cursor-grabbing',
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? 'border-violet-500'
                : 'border-transparent',
              dragIndex === index && 'opacity-50'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase host varies per env */}
            <img
              src={photo.public_url}
              alt={photo.caption || `Photo ${index + 1}`}
              className="size-full object-cover"
              draggable={false}
            />
            <span className="absolute left-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white">
              {index + 1}
            </span>
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => void handleRemove(photo)}
              className="absolute right-1 top-1 hidden size-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Drag photos to change their order.</p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
