'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useUpload } from '@/lib/hooks/useUpload';
import { acceptForType, mediaLimitLabel } from '@/lib/utils/uploadHelpers';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils/cn';
import type { MediaType, ProjectMedia } from '@/types';

interface MediaUploaderProps {
  projectId: string;
  type: MediaType;
  /** Photos allow multiple files; music/video are single-file (spec 12.2). */
  multiple?: boolean;
  /** Next sort_order for new photos. */
  nextSortOrder?: number;
  onUploaded: (media: ProjectMedia) => void;
}

const TYPE_LABEL: Record<MediaType, string> = {
  photo: 'photos',
  video: 'a video message',
  music: 'background music',
};

export function MediaUploader({
  projectId,
  type,
  multiple = false,
  nextSortOrder = 0,
  onUploaded,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploads, upload } = useUpload();

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = multiple ? Array.from(fileList) : [fileList[0]];
    for (let i = 0; i < files.length; i++) {
      const media = await upload({
        file: files[i],
        projectId,
        type,
        sortOrder: nextSortOrder + i,
      });
      if (media) onUploaded(media);
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  }

  const busy = uploads.some((u) => u.status === 'uploading');
  const errors = uploads.filter((u) => u.status === 'error');

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${TYPE_LABEL[type]}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 text-center transition-colors',
          dragging
            ? 'border-violet-500 bg-violet-50'
            : 'border-gray-300 bg-white hover:border-violet-400'
        )}
      >
        {busy ? (
          <Spinner className="text-violet-600" />
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Drop {TYPE_LABEL[type]} here or tap to browse
            </p>
            <p className="text-xs text-gray-400">{mediaLimitLabel(type)}</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptForType(type)}
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {uploads
        .filter((u) => u.status === 'uploading')
        .map((u) => (
          <p key={u.id} className="text-xs text-gray-500">
            Uploading {u.fileName}…
          </p>
        ))}
      {errors.map((u) => (
        <p key={u.id} role="alert" className="text-xs text-red-600">
          {u.fileName}: {u.error}
        </p>
      ))}
    </div>
  );
}
