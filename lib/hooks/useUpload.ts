import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildStoragePath, validateFile } from '@/lib/utils/uploadHelpers';
import type { MediaType, ProjectMedia } from '@/types';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  fileName: string;
  status: UploadStatus;
  error?: string;
}

interface UploadArgs {
  file: File;
  projectId: string;
  type: MediaType;
  sortOrder?: number;
}

/**
 * Spec 12.4 flow: validate client-side → upload browser→Storage → POST
 * /api/upload so the server inserts the project_media row (admin client).
 * supabase-js v2 has no byte-level progress callback, so progress is
 * per-file status rather than a percentage.
 */
export function useUpload() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const upload = useCallback(
    async ({ file, projectId, type, sortOrder = 0 }: UploadArgs): Promise<ProjectMedia | null> => {
      const itemId = `${Date.now()}-${file.name}`;

      const validationError = validateFile(file, type);
      if (validationError) {
        setUploads((u) => [
          ...u,
          { id: itemId, fileName: file.name, status: 'error', error: validationError },
        ]);
        return null;
      }

      setUploads((u) => [...u, { id: itemId, fileName: file.name, status: 'uploading' }]);

      const fail = (message: string): null => {
        setUploads((u) =>
          u.map((item) =>
            item.id === itemId ? { ...item, status: 'error' as const, error: message } : item
          )
        );
        return null;
      };

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return fail('Not signed in');

        const storagePath = buildStoragePath(user.id, projectId, type, file.name);

        const { error: storageError } = await supabase.storage
          .from('birthday-media')
          .upload(storagePath, file, { contentType: file.type });
        if (storageError) return fail(storageError.message);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, storagePath, type, sortOrder }),
        });
        const json = await res.json();
        if (!res.ok) return fail(json.error ?? 'Upload failed — try again');

        setUploads((u) =>
          u.map((item) => (item.id === itemId ? { ...item, status: 'done' as const } : item))
        );
        return json.media as ProjectMedia;
      } catch {
        return fail('Upload failed — try again');
      }
    },
    []
  );

  const clearFinished = useCallback(() => {
    setUploads((u) => u.filter((item) => item.status === 'uploading'));
  }, []);

  return { uploads, upload, clearFinished };
}
