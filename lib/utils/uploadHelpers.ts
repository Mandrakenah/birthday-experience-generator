import type { MediaType } from '@/types';

interface MediaLimit {
  maxBytes: number;
  mimeTypes: string[];
  label: string;
}

// Spec 12.4: photo ≤ 10MB (jpg/png/webp), video ≤ 200MB (mp4/webm), music ≤ 20MB (mp3/aac)
const LIMITS: Record<MediaType, MediaLimit> = {
  photo: {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'JPG, PNG or WebP up to 10MB',
  },
  video: {
    maxBytes: 200 * 1024 * 1024,
    mimeTypes: ['video/mp4', 'video/webm'],
    label: 'MP4 or WebM up to 200MB',
  },
  music: {
    maxBytes: 20 * 1024 * 1024,
    mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/mp4', 'audio/x-m4a'],
    label: 'MP3 or AAC up to 20MB',
  },
};

export function mediaLimitLabel(type: MediaType): string {
  return LIMITS[type].label;
}

export function acceptForType(type: MediaType): string {
  return LIMITS[type].mimeTypes.join(',');
}

/** Returns an error message, or null when the file is valid. */
export function validateFile(file: File, type: MediaType): string | null {
  const limit = LIMITS[type];
  if (!limit.mimeTypes.includes(file.type)) {
    return `Unsupported file type — use ${limit.label}`;
  }
  if (file.size > limit.maxBytes) {
    return `File is too large — ${limit.label}`;
  }
  return null;
}

/** Storage object keys: keep letters/digits/dots/dashes so URLs stay clean. */
export function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Spec 7.2 / 12.4 path convention: {creator_id}/{project_id}/{type}/{timestamp}-{filename} */
export function buildStoragePath(
  creatorId: string,
  projectId: string,
  type: MediaType,
  fileName: string
): string {
  return `${creatorId}/${projectId}/${type}/${Date.now()}-${sanitizeFileName(fileName)}`;
}
