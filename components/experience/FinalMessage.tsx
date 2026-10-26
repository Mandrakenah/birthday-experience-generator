'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CakeSliceAnimation } from '@/components/experience/CakeSliceAnimation';
import { CakeIcon, HeartIcon, ReplayIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

interface FinalMessageProps {
  message: string;
  recipient: string;
  fontClass: string;
  onReplay: () => void;
}

/** Last scene: cake slice + fade-in emotional ending text (spec 17.2), then replay. */
export function FinalMessage({ message, recipient, fontClass, onReplay }: FinalMessageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      <CakeSliceAnimation />
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1.4, ease: 'easeOut' }}
        className={cn(
          'max-w-2xl whitespace-pre-wrap text-2xl font-light leading-relaxed md:text-4xl',
          fontClass
        )}
      >
        {message || `Happy birthday, ${recipient || 'friend'}. You are so loved.`}
      </motion.p>
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.8, ease: 'easeOut' }}
      >
        <HeartIcon className="size-9" />
      </motion.span>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-current px-6 text-base font-medium"
        >
          <ReplayIcon className="size-5" />
          Watch again
        </button>
        <p className="flex items-center gap-1.5 text-sm opacity-60">
          Made with love, just for you
          <CakeIcon className="size-4" />
        </p>
        <Link href="/" className="text-xs underline opacity-50 hover:opacity-80">
          Make a birthday surprise for someone
        </Link>
      </motion.div>
    </div>
  );
}
