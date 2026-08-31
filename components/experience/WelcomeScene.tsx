'use client';

import { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { SparklesIcon } from '@/components/ui/icons';

// Spec 14.2
export const letterVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

interface WelcomeSceneProps {
  recipient: string;
  onComplete: () => void;
}

function StaggeredLine({ text, offset, className }: { text: string; offset: number; className: string }) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from(text).map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          custom={offset + i}
          variants={letterVariants}
          initial="hidden"
          animate="visible"
          className="inline-block"
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </span>
  );
}

/** "Happy Birthday [Name]" letter-stagger, ~4s then auto-advance (spec 17.2). */
export function WelcomeScene({ recipient, onComplete }: WelcomeSceneProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const line1 = 'Happy Birthday';
  const line2 = recipient || 'to you';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center"
      aria-label={`${line1} ${line2}`}
    >
      <StaggeredLine text={line1} offset={0} className="text-3xl font-bold sm:text-6xl" />
      <StaggeredLine
        text={line2}
        offset={line1.length}
        className="text-4xl font-extrabold sm:text-7xl"
      />
      <motion.span
        aria-hidden="true"
        className="mt-6"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: (line1.length + line2.length) * 0.05 + 0.3, duration: 0.5 }}
      >
        <SparklesIcon className="size-12" />
      </motion.span>
    </div>
  );
}
