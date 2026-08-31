'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProjectMedia } from '@/types';
import { ImageIcon } from '@/components/ui/icons';

const SLIDE_MS = 4500;
const EMPTY_MS = 3000;

interface PhotoSlideshowProps {
  photos: ProjectMedia[];
  onComplete: () => void;
}

/** Auto-advancing carousel with Ken Burns crossfades (spec 5.2/17.2). */
export function PhotoSlideshow({ photos, onComplete }: PhotoSlideshowProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (photos.length === 0 || index + 1 >= photos.length) onComplete();
        else setIndex(index + 1);
      },
      photos.length === 0 ? EMPTY_MS : SLIDE_MS
    );
    return () => clearTimeout(timer);
  }, [index, photos.length, onComplete]);

  // Spec 20.1: no photos → single placeholder slide.
  if (photos.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <ImageIcon className="size-14 opacity-60" />
        <p className="text-xl opacity-70">No photos yet</p>
      </div>
    );
  }

  const photo = photos[index];
  // Alternate the Ken Burns drift direction per slide.
  const drift = index % 2 === 0 ? 24 : -24;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div
          key={photo.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <motion.img
            src={photo.public_url}
            alt={photo.caption || `Memory ${index + 1}`}
            className="size-full object-cover"
            initial={{ scale: 1.02, x: 0 }}
            animate={{ scale: 1.16, x: drift }}
            transition={{ duration: SLIDE_MS / 1000 + 1, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      {photo.caption && (
        <motion.p
          key={`caption-${photo.id}`}
          className="absolute inset-x-0 bottom-16 px-6 text-center text-lg font-medium text-white drop-shadow-md sm:text-2xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {photo.caption}
        </motion.p>
      )}

      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-1.5">
        {photos.map((p, i) => (
          <span
            key={p.id}
            className={`h-1 rounded-full bg-white transition-all duration-500 ${
              i === index ? 'w-6 opacity-100' : 'w-3 opacity-40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
