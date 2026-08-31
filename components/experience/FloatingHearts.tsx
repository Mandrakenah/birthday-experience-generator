'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

// Filled heart reads cuter than an outline — the signature of the Sweetheart theme.
function FilledHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 1.8 4.7 5.2 4.1 7.3 3.7 9 4.7 12 7.7c3-3 4.7-4 6.8-3.6 3.4.6 4.8 4.3 3.2 7.6C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

// Ambient drifting hearts — the "cute" layer for the Sweetheart theme.
// Foreground overlay (pointer-events-none) so it never blocks taps.
const HEARTS = [
  { left: '6%', size: 'size-5', color: 'text-rose-400/70', delay: 0, dur: 5.2, sway: 10, rot: -10 },
  { left: '17%', size: 'size-7', color: 'text-pink-400/70', delay: 1.7, dur: 6.4, sway: -14, rot: 8 },
  { left: '29%', size: 'size-4', color: 'text-fuchsia-400/70', delay: 0.8, dur: 4.7, sway: 12, rot: -6 },
  { left: '40%', size: 'size-6', color: 'text-rose-500/70', delay: 2.4, dur: 5.8, sway: -10, rot: 12 },
  { left: '52%', size: 'size-5', color: 'text-pink-500/70', delay: 0.4, dur: 5, sway: 14, rot: -8 },
  { left: '63%', size: 'size-8', color: 'text-rose-400/70', delay: 2, dur: 6.8, sway: -12, rot: 6 },
  { left: '74%', size: 'size-4', color: 'text-fuchsia-400/70', delay: 1.1, dur: 4.9, sway: 10, rot: -12 },
  { left: '84%', size: 'size-6', color: 'text-pink-400/70', delay: 2.7, dur: 6, sway: -14, rot: 9 },
  { left: '93%', size: 'size-5', color: 'text-rose-500/70', delay: 0.6, dur: 5.4, sway: 12, rot: -7 },
];

export function FloatingHearts() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {HEARTS.map((h, i) => (
        <motion.span
          key={i}
          className={cn('absolute bottom-0', h.color, h.size)}
          style={{ left: h.left }}
          initial={{ y: 0, opacity: 0, rotate: h.rot }}
          animate={{ y: [0, -540], x: [0, h.sway, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'easeOut' }}
        >
          <FilledHeart className="size-full" />
        </motion.span>
      ))}
    </div>
  );
}
