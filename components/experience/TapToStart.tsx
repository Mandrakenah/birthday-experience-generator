'use client';

import { motion } from 'framer-motion';
import { GiftIcon } from '@/components/ui/icons';

interface TapToStartProps {
  recipient: string;
  onStart: () => void;
}

/** Initial tap gate — the user gesture that unlocks audio autoplay (spec 5.2). */
export function TapToStart({ recipient, onStart }: TapToStartProps) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <motion.span
        aria-hidden="true"
        className="text-current"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GiftIcon className="size-20" />
      </motion.span>
      <span className="text-2xl font-semibold sm:text-3xl">
        Something special is waiting for {recipient || 'you'}…
      </span>
      <motion.span
        className="rounded-full border-2 border-current px-6 py-3 text-lg font-medium"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Tap to begin
      </motion.span>
    </button>
  );
}
