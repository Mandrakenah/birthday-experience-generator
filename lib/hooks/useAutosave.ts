import { useCallback, useEffect, useRef } from 'react';

type Save<T> = (value: T, keepalive: boolean) => Promise<boolean>;

const UNSAVED = Symbol('unsaved');

/**
 * Debounced save of `value` whenever it changes, plus an immediate flush on
 * blur (the returned function), unmount, and page hide — so typing and then
 * closing the tab or navigating away doesn't drop the edit. The initial value
 * counts as already saved. A failed save is retried on the next change.
 */
export function useAutosave<T>(value: T, save: Save<T>, delay = 800) {
  const saved = useRef<T | typeof UNSAVED>(value);
  const latest = useRef(value);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
    latest.current = value;
  });

  const flush = useCallback((keepalive = false) => {
    const current = latest.current;
    if (Object.is(current, saved.current)) return;
    saved.current = current;
    void saveRef.current(current, keepalive).then((ok) => {
      if (!ok && Object.is(saved.current, current)) saved.current = UNSAVED;
    });
  }, []);

  useEffect(() => {
    if (Object.is(value, saved.current)) return;
    const timer = setTimeout(() => flush(), delay);
    return () => clearTimeout(timer);
  }, [value, delay, flush]);

  useEffect(() => {
    const onHide = () => flush(true);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      flush(true);
    };
  }, [flush]);

  return flush;
}
