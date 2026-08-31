'use client';

import type { ProjectMedia } from '@/types';

interface VideoSceneProps {
  video: ProjectMedia;
  onComplete: () => void;
}

/**
 * Full-screen video message; the shell pauses background music while this
 * scene is mounted and resumes after (spec 17.3). Advances on ended.
 */
export function VideoScene({ video, onComplete }: VideoSceneProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black">
      <video
        src={video.public_url}
        autoPlay
        playsInline
        controls
        onEnded={onComplete}
        className="max-h-screen w-full object-contain"
      />
      <button
        type="button"
        onClick={onComplete}
        className="absolute right-4 top-4 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur hover:bg-white/30"
      >
        Skip →
      </button>
    </div>
  );
}
