'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

// Spec 14.1
export const sceneVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.5, ease: 'easeIn' } },
};

/** Fade/slide wrapper between scenes. Key it by scene id inside AnimatePresence. */
export function SceneTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={sceneVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative z-10 min-h-screen w-full"
    >
      {children}
    </motion.div>
  );
}
