'use client';

import type { RefObject } from 'react';

interface MusicPlayerProps {
  src: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
}

/** Invisible audio element; useAudio drives it imperatively (spec 5.2/17.3). */
export function MusicPlayer({ src, audioRef }: MusicPlayerProps) {
  if (!src) return null; // no music uploaded → renders nothing (spec 20.1)
  return <audio ref={audioRef} src={src} loop preload="auto" className="hidden" />;
}
