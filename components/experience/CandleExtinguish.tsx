'use client';

import { motion, type Variants } from 'framer-motion';

// Spec 14.3
export const flameVariants: Variants = {
  flicker: {
    scaleY: [1, 1.1, 0.95, 1.05, 1],
    scaleX: [1, 0.95, 1.05, 0.98, 1],
    transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
  },
  extinguished: {
    scaleY: 0,
    opacity: 0,
    transition: { duration: 0.35 },
  },
};

interface CandleExtinguishProps {
  /** Candle x-position inside the cake SVG. */
  x: number;
  isOut: boolean;
  candleColor: string;
}

/** One SVG candle whose flame flickers until extinguished (spec 5.2). */
export function CandleExtinguish({ x, isOut, candleColor }: CandleExtinguishProps) {
  return (
    <g>
      {/* candle body */}
      <rect x={x - 4} y={92} width={8} height={36} rx={2} fill={candleColor} />
      <rect x={x - 4} y={92} width={3.5} height={36} rx={1.5} fill="#ffffff" opacity={0.35} />
      {/* wick */}
      <line x1={x} y1={92} x2={x} y2={86} stroke="#5b4636" strokeWidth={1.6} />
      {/* flame — transform-origin at the wick so it shrinks downward */}
      <motion.g
        variants={flameVariants}
        animate={isOut ? 'extinguished' : 'flicker'}
        style={{ originX: `${x}px`, originY: '86px' }}
      >
        <ellipse cx={x} cy={76} rx={6.5} ry={11} fill="#FF9800" opacity={0.85} />
        <ellipse cx={x} cy={78} rx={3.5} ry={6.5} fill="#FFEB3B" />
      </motion.g>
      {/* smoke wisp once out */}
      {isOut && (
        <motion.path
          d={`M ${x} 86 q -3 -8 0 -14 q 3 -6 0 -12`}
          stroke="#9e9e9e"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          initial={{ opacity: 0.7, pathLength: 0 }}
          animate={{ opacity: 0, pathLength: 1, y: -6 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      )}
    </g>
  );
}
