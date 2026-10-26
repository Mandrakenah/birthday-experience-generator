'use client';

import { motion } from 'framer-motion';
import { MessageHeartIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import type { ProjectWish } from '@/types';

interface WishesSceneProps {
  wishes: ProjectWish[];
  fontClass: string;
  onComplete: () => void;
}

// Cap the stagger so a card with 100 wishes doesn't take a minute to settle.
const stagger = (i: number) => Math.min(i, 12) * 0.25;

/** Wall of messages friends left via /wish/[id]. Cards use currentColor so every theme reads well. */
export function WishesScene({ wishes, fontClass, onComplete }: WishesSceneProps) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 px-5 pb-20 pt-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <MessageHeartIcon className="size-10" />
        <h2 className="text-2xl font-bold sm:text-4xl">
          {wishes.length === 1
            ? 'Someone else wanted to say happy birthday'
            : `${wishes.length} people wanted to say happy birthday`}
        </h2>
      </div>

      <div className="w-full max-w-3xl columns-1 gap-4 sm:columns-2">
        {wishes.map((wish, i) => (
          <motion.figure
            key={wish.id}
            initial={{ opacity: 0, y: 24, rotate: i % 2 ? 1.5 : -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.3 + stagger(i), duration: 0.6, ease: 'easeOut' }}
            className="mb-4 break-inside-avoid rounded-2xl border border-current/20 bg-current/5 p-5 text-left backdrop-blur-sm"
          >
            <blockquote className={cn('whitespace-pre-wrap break-words text-lg leading-snug', fontClass)}>
              {wish.message}
            </blockquote>
            <figcaption className="mt-3 text-sm font-semibold opacity-75">— {wish.author_name}</figcaption>
          </motion.figure>
        ))}
      </div>

      <motion.button
        type="button"
        onClick={onComplete}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 + stagger(wishes.length), duration: 0.5 }}
        className="h-11 rounded-full border-2 border-current px-8 text-base font-medium"
      >
        Continue →
      </motion.button>
    </div>
  );
}
