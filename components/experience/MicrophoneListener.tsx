'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { isMicrophoneSupported, useMicrophone } from '@/lib/hooks/useMicrophone';
import { MicIcon, SparklesIcon, WindIcon } from '@/components/ui/icons';

interface MicrophoneListenerProps {
  onBlow: () => void;
  /** Stops prompting once every candle is out. */
  done: boolean;
}

/**
 * Mic permission flow + blow prompt (spec 13.2). Fallback when unsupported
 * or denied: a tap button that extinguishes one candle per click.
 */
export function MicrophoneListener({ onBlow, done }: MicrophoneListenerProps) {
  const [supported] = useState(() => isMicrophoneSupported());
  const { startListening, isListening, hasPermission, error } = useMicrophone({ onBlow });

  if (done) {
    return (
      <p className="flex items-center gap-2 text-lg font-medium">
        <SparklesIcon className="size-6" />
        You did it!
      </p>
    );
  }

  // Spec 20.1: no Web Audio support or permission denied → tap fallback.
  if (!supported || hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onBlow}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-current px-6 text-base font-medium"
        >
          <WindIcon className="size-5" />
          Click to blow out candles
        </button>
        {error && <p className="text-xs opacity-60">Mic unavailable: {error}</p>}
      </div>
    );
  }

  if (!isListening) {
    return (
      <button
        type="button"
        onClick={() => void startListening()}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-current px-6 text-base font-medium"
      >
        <MicIcon className="size-5" />
        Tap to blow out the candles
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.p
        className="flex items-center gap-2 text-lg font-medium"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <WindIcon className="size-6" />
        Blow into your microphone!
      </motion.p>
      {/* A granted-but-silent mic (muted hardware, quiet room) would otherwise
          dead-end the recipient here with no way to reach the finale. */}
      <button type="button" onClick={onBlow} className="text-sm underline opacity-70">
        Not working? Tap instead
      </button>
    </div>
  );
}
