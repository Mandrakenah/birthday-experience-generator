'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useAudio } from '@/lib/hooks/useAudio';
import { useExperienceState } from '@/lib/hooks/useExperienceState';
import { resolveTheme } from '@/lib/utils/resolveTheme';
import { SceneTransition } from '@/components/experience/SceneTransition';
import { MusicPlayer } from '@/components/experience/MusicPlayer';
import { TapToStart } from '@/components/experience/TapToStart';
import { WelcomeScene } from '@/components/experience/WelcomeScene';
import { PhotoSlideshow } from '@/components/experience/PhotoSlideshow';
import { MessageScene } from '@/components/experience/MessageScene';
import { WishesScene } from '@/components/experience/WishesScene';
import { VideoScene } from '@/components/experience/VideoScene';
import { CakeScene } from '@/components/experience/CakeScene';
import { Fireworks } from '@/components/experience/Fireworks';
import { FinalMessage } from '@/components/experience/FinalMessage';
import { FloatingHearts } from '@/components/experience/FloatingHearts';
import { CustomStickers } from '@/components/experience/CustomStickers';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { SparklesIcon, VolumeIcon, VolumeOffIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import type { ExperienceData, SceneId } from '@/types';

const FIREWORKS_MS = 5000;

/** Root of /b/[slug]: scene state machine in the exact spec 17.2 order. */
export function ExperienceShell({ data }: { data: ExperienceData }) {
  const { project, photos, video, music, wishes } = data;

  const scenes = useMemo<SceneId[]>(() => {
    const list: SceneId[] = ['tap-to-start', 'welcome', 'slideshow', 'message'];
    if (wishes.length) list.push('wishes');
    if (video) list.push('video'); // no video → scene skipped (spec 20.1)
    list.push('cake', 'fireworks', 'finale');
    return list;
  }, [video, wishes.length]);

  const { sceneIndex, currentScene, resuming, advance, start, restart } = useExperienceState(
    scenes,
    `bday-experience-${project.id}`
  );
  const { audioRef, play, pause, fadeOut } = useAudio();
  const [muted, setMuted] = useState(false);

  const theme = resolveTheme(project);
  const ct = theme.custom;

  // Music control (spec 17.3): pause for video, resume after, 2s fade on finale.
  const prevSceneRef = useRef<SceneId>(currentScene);
  useEffect(() => {
    const prev = prevSceneRef.current;
    prevSceneRef.current = currentScene;
    if (currentScene === 'video') pause();
    else if (prev === 'video' && currentScene !== 'finale') play();
    if (currentScene === 'finale') fadeOut(2000);
  }, [currentScene, play, pause, fadeOut]);

  // Fireworks runs for 5s, then advances (spec 17.2).
  useEffect(() => {
    if (currentScene !== 'fireworks') return;
    const timer = setTimeout(advance, FIREWORKS_MS);
    return () => clearTimeout(timer);
  }, [currentScene, advance]);

  function handleStart() {
    play(); // user gesture — unlocks audio (spec 1.5)
    start();
  }

  function handleRestart() {
    play();
    restart();
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  return (
    // reducedMotion="user": framer-motion skips transform animations for
    // visitors who ask their OS for less motion.
    <MotionConfig reducedMotion="user">
      <div
        className={cn('relative min-h-screen overflow-hidden', theme.className)}
        style={theme.style}
      >
        <MusicPlayer src={music?.public_url ?? null} audioRef={audioRef} />

        {/* custom background photo (behind everything) */}
        {ct?.backgroundImage && (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase host varies per env
          <img
            src={ct.backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 z-0 h-full w-full object-cover"
            style={{ opacity: ct.backgroundOpacity }}
          />
        )}

        {ct && <CustomStickers stickers={ct.stickers} />}
        {project.theme === 'sweetheart' && <FloatingHearts />}

        {music && currentScene !== 'tap-to-start' && currentScene !== 'video' && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute music' : 'Mute music'}
            className="fixed left-4 top-4 z-40 flex size-11 items-center justify-center rounded-full border border-current/25 bg-current/10 backdrop-blur"
          >
            {muted ? <VolumeOffIcon className="size-5" /> : <VolumeIcon className="size-5" />}
          </button>
        )}

        <AnimatePresence mode="wait">
          <SceneTransition key={currentScene}>
            {currentScene === 'tap-to-start' && (
              <TapToStart recipient={project.recipient} resuming={resuming} onStart={handleStart} />
            )}
            {currentScene === 'welcome' && (
              <WelcomeScene recipient={project.recipient} onComplete={advance} />
            )}
            {currentScene === 'slideshow' && (
              <PhotoSlideshow photos={photos} onComplete={advance} />
            )}
            {currentScene === 'message' && (
              <MessageScene message={project.message} fontClass={theme.fontClass} onComplete={advance} />
            )}
            {currentScene === 'wishes' && (
              <WishesScene wishes={wishes} fontClass={theme.fontClass} onComplete={advance} />
            )}
            {currentScene === 'video' && video && (
              <VideoScene video={video} onComplete={advance} />
            )}
            {currentScene === 'cake' && (
              <CakeScene
                candleCount={project.candle_count ?? 5}
                candleColor={theme.candleColor}
                onAllExtinguished={advance}
              />
            )}
            {currentScene === 'fireworks' && (
              <div className="flex min-h-screen items-center justify-center bg-black/80">
                <Fireworks duration={FIREWORKS_MS} />
                <p className="flex items-center gap-3 text-3xl font-bold text-white sm:text-5xl">
                  <SparklesIcon className="size-9 sm:size-12" />
                  Hooray!
                </p>
              </div>
            )}
            {currentScene === 'finale' && (
              <FinalMessage
                message={project.final_message}
                recipient={project.recipient}
                fontClass={theme.fontClass}
                onReplay={handleRestart}
              />
            )}
          </SceneTransition>
        </AnimatePresence>

        {currentScene !== 'tap-to-start' && (
          <ProgressDots
            total={scenes.length - 1}
            current={sceneIndex - 1}
            className={cn('fixed inset-x-0 bottom-3 z-30', theme.accentClassName)}
            style={theme.accentStyle}
          />
        )}
      </div>
    </MotionConfig>
  );
}
