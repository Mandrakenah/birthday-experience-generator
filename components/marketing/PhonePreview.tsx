'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HeartIcon, ImageIcon, MicIcon, SparklesIcon } from '@/components/ui/icons';
import { CakeBody, candleXs } from '@/components/experience/CakeBody';
import { CandleExtinguish } from '@/components/experience/CandleExtinguish';
import { FloatingHearts } from '@/components/experience/FloatingHearts';
import { STICKERS } from '@/components/experience/Stickers';
import { themes, type PresetThemeName } from '@/lib/utils/themes';
import { cn } from '@/lib/utils/cn';
import type { ThemeConfig } from '@/types';

const SCENE_MS = 2600;

// Each scene plays in a different theme so the hero demos the whole experience
// AND all themes in one loop. Lead with Sweetheart so the cute hearts theme is
// the first thing visitors see. Scenes mirror the real components (same cake
// SVG + candles, theme colors) — faithful to what the birthday person sees.
const PREVIEW_THEME_ORDER: PresetThemeName[] = [
  'sweetheart',
  'default',
  'elegant',
  'sunset',
  'ocean',
  'forest',
];
const THEME_LIST = PREVIEW_THEME_ORDER.map((name) => themes[name]);

type SceneProps = { theme: ThemeConfig };

function Welcome({ theme }: SceneProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
      <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', theme.textAccent)}>
        Happy Birthday
      </p>
      <p className={cn('text-4xl font-extrabold', theme.textPrimary)}>Mom</p>
      <SparklesIcon className={cn('size-8', theme.textAccent)} />
    </div>
  );
}

function Slideshow({ theme }: SceneProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
      <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-slate-400/40 backdrop-blur-sm">
        <ImageIcon className="size-9 text-white/80" />
      </div>
      <p className={cn('text-sm font-medium', theme.textPrimary)}>Paris, 2019</p>
    </div>
  );
}

function Message({ theme }: SceneProps) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <p className={cn('text-lg font-medium leading-snug', theme.textPrimary)}>
        &ldquo;You mean the world to me.&rdquo;
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
      </p>
    </div>
  );
}

function Cake({ theme }: SceneProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      {/* same cake + candles the recipient sees, lit, in this theme's candle color */}
      <svg viewBox="0 0 320 270" className="w-44" role="img" aria-label="Birthday cake">
        <CakeBody />
        {candleXs(5).map((x, i) => (
          <CandleExtinguish key={i} x={x} isOut={false} candleColor={theme.candleColor} />
        ))}
      </svg>
      <p className={cn('inline-flex items-center gap-1.5 text-sm font-medium', theme.textPrimary)}>
        <MicIcon className="size-4" />
        Blow out the candles
      </p>
    </div>
  );
}

function FireworksScene({ theme }: SceneProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
      <SparklesIcon className={cn('size-12', theme.textAccent)} />
      <p className={cn('text-2xl font-extrabold', theme.textPrimary)}>Hooray!</p>
    </div>
  );
}

function Finale({ theme }: SceneProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
      <HeartIcon className={cn('size-9', theme.textAccent)} />
      <p className={cn('text-xl font-bold', theme.textPrimary)}>Happy Birthday, Mom</p>
      <p className={cn('text-xs', theme.textAccent)}>made with love</p>
    </div>
  );
}

// Showcase frame for the "build your own" custom theme — own colors + scattered
// stickers + a "make it your own" label, so the cycle advertises the builder.
function CustomSlide() {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center gap-2 px-5 text-center"
      style={{ color: '#3b0764' }}
    >
      <span className="absolute left-5 top-12 w-10">
        <STICKERS.teddy.Sticker className="h-auto w-full" />
      </span>
      <span className="absolute right-5 top-20 w-8">
        <STICKERS.star.Sticker className="h-auto w-full" />
      </span>
      <span className="absolute bottom-20 left-8 w-9">
        <STICKERS.heart.Sticker className="h-auto w-full" />
      </span>
      <span className="absolute bottom-14 right-6 w-10">
        <STICKERS.balloon.Sticker className="h-auto w-full" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
        Make it your own
      </p>
      <p className="text-2xl font-extrabold">Fully custom</p>
      <p className="text-xs text-purple-700/80">your colors · photo · stickers</p>
    </div>
  );
}

const SCENES = [Welcome, Slideshow, Message, Cake, FireworksScene, Finale];
// One extra frame after the themed scenes showcases the custom builder.
const SLIDE_COUNT = SCENES.length + 1;
const CUSTOM_BG = 'linear-gradient(135deg, #fce7f3, #ede9fe)';

export function PhonePreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDE_COUNT), SCENE_MS);
    return () => clearInterval(timer);
  }, []);

  const isCustomSlide = index === SCENES.length;
  const Scene = SCENES[index % SCENES.length];
  const theme = THEME_LIST[index % THEME_LIST.length];

  return (
    <div className="relative mx-auto w-[260px] max-w-full">
      {/* metallic frame */}
      <div className="relative rounded-[3rem] bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 p-[11px] shadow-2xl shadow-slate-900/50">
        {/* side buttons */}
        <span className="absolute -left-[3px] top-24 h-7 w-[3px] rounded-l bg-slate-700" />
        <span className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l bg-slate-700" />
        <span className="absolute -left-[3px] top-52 h-12 w-[3px] rounded-l bg-slate-700" />
        <span className="absolute -right-[3px] top-44 h-16 w-[3px] rounded-r bg-slate-700" />

        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.3rem] bg-slate-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className={cn('absolute inset-0', !isCustomSlide && theme.background)}
              style={isCustomSlide ? { background: CUSTOM_BG } : undefined}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {isCustomSlide ? <CustomSlide /> : <Scene theme={theme} />}
            </motion.div>
          </AnimatePresence>

          {/* cute hearts on the Sweetheart theme */}
          {!isCustomSlide && theme.name === 'sweetheart' && <FloatingHearts />}

          {/* screen gloss */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-white/0 via-white/0 to-white/15"
          />

          {/* status bar */}
          <div
            className={cn(
              'absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-2 text-[10px] font-semibold',
              theme.textPrimary
            )}
          >
            <span>9:41</span>
            <span className="relative inline-block h-2.5 w-5 rounded-[3px] border border-current">
              <span className="absolute inset-[2px] right-1.5 rounded-[1px] bg-current" />
            </span>
          </div>

          {/* dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-40 flex h-6 w-[5.5rem] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5">
            <span className="size-1.5 rounded-full bg-slate-600" />
          </div>

          {/* progress dots */}
          <div className="absolute inset-x-0 bottom-5 z-30 flex justify-center gap-1.5">
            {Array.from({ length: SLIDE_COUNT }, (_, dot) => (
              <span
                key={dot}
                className={cn(
                  'size-1.5 rounded-full transition-colors duration-300',
                  dot === index ? 'bg-white shadow' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        A preview · 6 themes + a fully custom builder
      </p>
    </div>
  );
}
