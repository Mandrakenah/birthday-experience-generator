import { useCallback, useEffect, useState } from 'react';
import type { SceneId } from '@/types';

/**
 * Current scene index, persisted to sessionStorage so a refresh can resume
 * where the recipient left off (spec 5.4). The experience always reopens on
 * the tap gate — music can only start from a tap — and `start()` then jumps
 * to the saved scene.
 */
export function useExperienceState(scenes: SceneId[], storageKey: string) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [resumeIndex, setResumeIndex] = useState(0);

  // Read once on mount. Async (microtask) so SSR markup and first client
  // render match — reading in the initializer would cause hydration drift.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(storageKey);
    } catch {
      // Storage blocked (privacy mode / embedded webview) — just start fresh.
    }
    const index = Number.parseInt(saved ?? '', 10);
    if (Number.isInteger(index) && index > 1 && index < scenes.length) {
      queueMicrotask(() => setResumeIndex(index));
    }
  }, [storageKey, scenes.length]);

  useEffect(() => {
    if (sceneIndex === 0) return; // don't clobber saved progress while on the gate
    try {
      sessionStorage.setItem(storageKey, String(sceneIndex));
    } catch {
      // Best-effort only.
    }
  }, [storageKey, sceneIndex]);

  const advance = useCallback(() => {
    setSceneIndex((i) => Math.min(i + 1, scenes.length - 1));
  }, [scenes.length]);

  /** Leave the tap gate: back to where a refresh interrupted, else the first scene. */
  const start = useCallback(() => setSceneIndex(Math.max(1, resumeIndex)), [resumeIndex]);

  /** Play the whole thing again from the first scene. */
  const restart = useCallback(() => setSceneIndex(1), []);

  return {
    sceneIndex,
    currentScene: scenes[sceneIndex],
    resuming: resumeIndex > 1,
    advance,
    start,
    restart,
  };
}
