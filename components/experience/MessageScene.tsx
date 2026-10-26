'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

const CHAR_MS = 40;

interface MessageSceneProps {
  message: string;
  fontClass: string;
  onComplete: () => void;
}

/**
 * Typewriter personal message (spec 14.5), then a Continue button. Tapping
 * the text shows it all at once — a 500-character message would otherwise
 * take 20 seconds — and reduced-motion visitors get it immediately.
 */
export function MessageScene({ message, fontClass, onComplete }: MessageSceneProps) {
  const text = message || 'Wishing you the happiest of birthdays!';
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const done = reduceMotion || count >= text.length;

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => setCount((c) => c + 1), CHAR_MS);
    return () => clearTimeout(timer);
  }, [count, done]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <p
        onClick={() => setCount(text.length)}
        className={cn(
          'max-w-2xl whitespace-pre-wrap text-2xl font-light leading-relaxed md:text-4xl',
          !done && 'cursor-pointer',
          fontClass
        )}
      >
        {done ? text : text.slice(0, count)}
        {!done && <span className="ml-1 inline-block h-6 w-0.5 animate-pulse bg-current" />}
      </p>
      {done ? (
        <motion.button
          type="button"
          onClick={onComplete}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-11 rounded-full border-2 border-current px-8 text-base font-medium"
        >
          Continue →
        </motion.button>
      ) : (
        <p className="text-xs opacity-50">Tap the message to show it all</p>
      )}
    </div>
  );
}
