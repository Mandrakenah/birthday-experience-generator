'use client';

import { motion } from 'framer-motion';
import { CakeSliceAnimation } from '@/components/experience/CakeSliceAnimation';
import { CakeIcon, HeartIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

interface FinalMessageProps {
  message: string;
  recipient: string;
  fontClass: string;
}

/** Last scene: cake slice + fade-in emotional ending text (spec 17.2). */
export function FinalMessage({ message, recipient, fontClass }: FinalMessageProps) {
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
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 2.6, duration: 1 }}
        className="flex items-center gap-1.5 text-sm"
      >
        Made with love, just for you
        <CakeIcon className="size-4" />
      </motion.p>
    </div>
  );
}
