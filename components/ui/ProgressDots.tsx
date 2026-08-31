import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
  style?: CSSProperties;
}

/** Horizontal dot indicator for scene progress (spec 5.3). */
export function ProgressDots({ total, current, className, style }: ProgressDotsProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      style={style}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label="Scene progress"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i === current ? 'size-2.5 bg-current' : 'size-1.5 bg-current opacity-40'
          )}
        />
      ))}
    </div>
  );
}
