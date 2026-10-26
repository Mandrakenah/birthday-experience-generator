'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GiftIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import { resolveTheme } from '@/lib/utils/resolveTheme';
import type { BirthdayProject } from '@/types';

interface RevealCountdownProps {
  project: Pick<BirthdayProject, 'recipient' | 'theme' | 'custom_theme' | 'font_family'>;
  /** Server-computed, so the countdown doesn't depend on the viewer's clock being right. */
  msRemaining: number;
}

// `per`: how many of this unit fit in the next larger one.
const UNITS = [
  { label: 'days', ms: 86_400_000, per: Infinity },
  { label: 'hours', ms: 3_600_000, per: 24 },
  { label: 'minutes', ms: 60_000, per: 60 },
  { label: 'seconds', ms: 1000, per: 60 },
];

/** Shown at /b/[slug] until the creator's chosen reveal time; then reloads into the experience. */
export function RevealCountdown({ project, msRemaining }: RevealCountdownProps) {
  const router = useRouter();
  const theme = resolveTheme(project);
  const [left, setLeft] = useState(msRemaining);

  useEffect(() => {
    const deadline = performance.now() + msRemaining;
    const timer = setInterval(() => {
      const next = Math.max(0, deadline - performance.now());
      setLeft(next);
      if (next === 0) {
        clearInterval(timer);
        router.refresh(); // the server now renders the experience
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [msRemaining, router]);

  const parts = UNITS.map(({ label, ms, per }) => ({
    label,
    value: Math.floor(left / ms) % per,
  }));

  return (
    <main
      className={cn(
        'flex min-h-screen flex-1 flex-col items-center justify-center gap-8 px-6 text-center',
        theme.className,
        theme.fontClass
      )}
      style={theme.style}
    >
      <motion.span
        aria-hidden="true"
        animate={{ rotate: [0, -8, 8, -4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
      >
        <GiftIcon className="size-20" />
      </motion.span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold sm:text-5xl">
          Something special is coming{project.recipient ? `, ${project.recipient}` : ''}
        </h1>
        <p className="text-base opacity-75 sm:text-lg">It unlocks in…</p>
      </div>
      <div className="flex gap-3 sm:gap-5" role="timer" aria-live="off">
        {parts.map(({ label, value }) => (
          <div
            key={label}
            className="flex min-w-18 flex-col items-center rounded-2xl border border-current/20 bg-current/5 px-2 py-3 sm:min-w-24"
          >
            <span className="text-3xl font-bold tabular-nums sm:text-5xl">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
          </div>
        ))}
      </div>
      <p className="max-w-sm text-sm opacity-70">
        Keep this link — come back when the timer runs out. Sound on for the best experience.
      </p>
    </main>
  );
}
