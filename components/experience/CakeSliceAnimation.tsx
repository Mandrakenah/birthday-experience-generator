'use client';

import { motion, type Variants } from 'framer-motion';
import { CakeSliceIcon } from '@/components/ui/icons';

// Spec 14.4
export const cakeSliceVariants: Variants = {
  hidden: { scale: 0.2, opacity: 0, y: 100 },
  visible: {
    scale: 2.5,
    opacity: 1,
    y: -50,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Cake slice scaling toward the camera during the finale (spec 5.2). */
export function CakeSliceAnimation() {
  return (
    <motion.span
      variants={cakeSliceVariants}
      initial="hidden"
      animate="visible"
      className="inline-block"
      aria-hidden="true"
    >
      <CakeSliceIcon className="size-16" />
    </motion.span>
  );
}
