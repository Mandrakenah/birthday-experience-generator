import { useCallback, useEffect, useRef } from 'react';

/**
 * Imperative controls for the HTMLAudioElement rendered by MusicPlayer
 * (spec 5.4/17.3): play/pause plus the 2s fade-out the finale scene needs.
 * Deliberately stateless — scene effects drive it, so re-render state here
 * would only cause cascading renders.
 */
export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number>(0);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(fadeFrameRef.current);
    audio.volume = 1;
    audio.play().catch(() => {
      // Autoplay rejection — the tap-to-start gate normally prevents this.
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const fadeOut = useCallback(
    (durationMs = 2000) => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      const startVolume = audio.volume;
      const start = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        audio.volume = startVolume * (1 - progress);
        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          pause();
        }
      };
      fadeFrameRef.current = requestAnimationFrame(step);
    },
    [pause]
  );

  useEffect(() => () => cancelAnimationFrame(fadeFrameRef.current), []);

  return { audioRef, play, pause, fadeOut };
}
