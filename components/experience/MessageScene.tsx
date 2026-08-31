'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

// Spec 14.5, extended with onComplete so the Continue button can appear.
function TypewriterText({
  text,
  speed = 40,
  className,
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the text changes
  }, [text, speed]);

  return (
    <p className={cn('text-2xl md:text-4xl font-light leading-relaxed', className)}>
      {displayed}
      <span className="inline-block w-0.5 h-6 ml-1 bg-current animate-pulse" />
    </p>
  );
}

interface MessageSceneProps {
  message: string;
  fontClass: string;
  onComplete: () => void;
}

/** Typewriter personal message, then a Continue button (spec 17.2). */
export function MessageScene({ message, fontClass, onComplete }: MessageSceneProps) {
  const [done, setDone] = useState(false);
  const text = message || 'Wishing you the happiest of birthdays!';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <TypewriterText
        text={text}
        className={cn('max-w-2xl whitespace-pre-wrap', fontClass)}
        onComplete={() => setDone(true)}
      />
      {done && (
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
      )}
    </div>
  );
}
