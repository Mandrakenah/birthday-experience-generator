'use client';

import { useEffect, useState } from 'react';
import { CandleExtinguish } from '@/components/experience/CandleExtinguish';
import { CakeBody, candleXs, CAKE_WIDTH } from '@/components/experience/CakeBody';
import { MicrophoneListener } from '@/components/experience/MicrophoneListener';

interface CakeSceneProps {
  candleCount?: number;
  candleColor: string;
  onAllExtinguished: () => void;
}

/** SVG cake with flickering candles; advances once all are out (spec 13.4). */
export function CakeScene({
  candleCount = 5,
  candleColor,
  onAllExtinguished,
}: CakeSceneProps) {
  const [extinguished, setExtinguished] = useState(0);
  const done = extinguished >= candleCount;

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onAllExtinguished, 600);
    return () => clearTimeout(timer);
  }, [done, onAllExtinguished]);

  const xs = candleXs(candleCount);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <h2 className="text-2xl font-bold sm:text-4xl">Make a wish & blow out the candles!</h2>
      <p className="text-sm opacity-70">
        {candleCount - extinguished > 0
          ? `${candleCount - extinguished} candle${candleCount - extinguished === 1 ? '' : 's'} to go`
          : 'All out — make it count!'}
      </p>

      <svg
        viewBox={`0 0 ${CAKE_WIDTH} 270`}
        className="w-full max-w-xs sm:max-w-sm"
        role="img"
        aria-label="Birthday cake with candles"
      >
        <CakeBody />
        {xs.map((x, i) => (
          <CandleExtinguish key={i} x={x} isOut={i < extinguished} candleColor={candleColor} />
        ))}
      </svg>

      <MicrophoneListener
        done={done}
        onBlow={() => setExtinguished((prev) => Math.min(prev + 1, candleCount))}
      />
    </div>
  );
}
