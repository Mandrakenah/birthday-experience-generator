import { useCallback, useEffect, useState } from 'react';
import type { SceneId } from '@/types';

/**
 * Current scene index with advance/back, persisted to sessionStorage so a
 * refresh resumes where the recipient left off (spec 5.4).
 */
export function useExperienceState(scenes: SceneId[], storageKey: string) {
  const [sceneIndex, setSceneIndex] = useState(0);

  // Restore once on mount. Async (microtask) so SSR markup and first client
  // render match — restoring in the initializer would cause hydration drift.
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved === null) return;
    const index = Number.parseInt(saved, 10);
    if (Number.isInteger(index) && index > 0 && index < scenes.length) {
      queueMicrotask(() => setSceneIndex(index));
    }
  }, [storageKey, scenes.length]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, String(sceneIndex));
  }, [storageKey, sceneIndex]);

  const advance = useCallback(() => {
    setSceneIndex((i) => Math.min(i + 1, scenes.length - 1));
  }, [scenes.length]);

  const back = useCallback(() => {
    setSceneIndex((i) => Math.max(i - 1, 0));
  }, []);

  return {
    sceneIndex,
    currentScene: scenes[sceneIndex],
    isLastScene: sceneIndex === scenes.length - 1,
    advance,
    back,
  };
}
