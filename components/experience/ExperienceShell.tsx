'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/hooks/useAudio';
import { useExperienceState } from '@/lib/hooks/useExperienceState';
import { DEFAULT_CUSTOM_THEME, fontClasses, themes, type PresetThemeName } from '@/lib/utils/themes';
import { SceneTransition } from '@/components/experience/SceneTransition';
import { MusicPlayer } from '@/components/experience/MusicPlayer';
import { TapToStart } from '@/components/experience/TapToStart';
import { WelcomeScene } from '@/components/experience/WelcomeScene';
import { PhotoSlideshow } from '@/components/experience/PhotoSlideshow';
import { MessageScene } from '@/components/experience/MessageScene';
import { VideoScene } from '@/components/experience/VideoScene';
import { CakeScene } from '@/components/experience/CakeScene';
import { Fireworks } from '@/components/experience/Fireworks';
import { FinalMessage } from '@/components/experience/FinalMessage';
import { FloatingHearts } from '@/components/experience/FloatingHearts';
import { CustomStickers } from '@/components/experience/CustomStickers';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { SparklesIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import type { ExperienceData, SceneId } from '@/types';

const FIREWORKS_MS = 5000;

/** Root of /b/[slug]: scene state machine in the exact spec 17.2 order. */
export function ExperienceShell({ data }: { data: ExperienceData }) {
  const { project, photos, video, music } = data;

  const scenes = useMemo<SceneId[]>(() => {
    const list: SceneId[] = ['tap-to-start', 'welcome', 'slideshow', 'message'];
    if (video) list.push('video'); // no video → scene skipped (spec 20.1)
    list.push('cake', 'fireworks', 'finale');
    return list;
  }, [video]);

  const { sceneIndex, currentScene, advance } = useExperienceState(
    scenes,
    `bday-experience-${project.id}`
  );
  const { audioRef, play, pause, fadeOut } = useAudio();

  const isCustom = project.theme === 'custom';
  const ct = project.custom_theme ?? DEFAULT_CUSTOM_THEME;
  const preset = themes[project.theme as PresetThemeName] ?? themes.default;
  const fontClass =
    fontClasses[isCustom ? ct.fontFamily : project.font_family] ?? fontClasses.sans;
  const candleColor = isCustom ? ct.accentColor : preset.candleColor;

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
    advance();
  }

  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden',
        !isCustom && preset.background,
        !isCustom && preset.textPrimary
      )}
      style={
        isCustom
          ? { background: `linear-gradient(135deg, ${ct.bgFrom}, ${ct.bgTo})`, color: ct.textColor }
          : undefined
      }
    >
      <MusicPlayer src={music?.public_url ?? null} audioRef={audioRef} />

      {/* custom background photo (behind everything) */}
      {isCustom && ct.backgroundImage && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user host
        <img
          src={ct.backgroundImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ opacity: ct.backgroundOpacity }}
        />
      )}

      {isCustom && <CustomStickers stickers={ct.stickers} />}
      {project.theme === 'sweetheart' && <FloatingHearts />}

      <AnimatePresence mode="wait">
        <SceneTransition key={currentScene}>
          {currentScene === 'tap-to-start' && (
            <TapToStart recipient={project.recipient} onStart={handleStart} />
          )}
          {currentScene === 'welcome' && (
            <WelcomeScene recipient={project.recipient} onComplete={advance} />
          )}
          {currentScene === 'slideshow' && (
            <PhotoSlideshow photos={photos} onComplete={advance} />
          )}
          {currentScene === 'message' && (
            <MessageScene message={project.message} fontClass={fontClass} onComplete={advance} />
          )}
          {currentScene === 'video' && video && (
            <VideoScene video={video} onComplete={advance} />
          )}
          {currentScene === 'cake' && (
            <CakeScene candleColor={candleColor} onAllExtinguished={advance} />
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
              fontClass={fontClass}
            />
          )}
        </SceneTransition>
      </AnimatePresence>

      {currentScene !== 'tap-to-start' && (
        <ProgressDots
          total={scenes.length - 1}
          current={sceneIndex - 1}
          className={cn('fixed inset-x-0 bottom-3 z-30', !isCustom && preset.textAccent)}
          style={isCustom ? { color: ct.accentColor } : undefined}
        />
      )}
    </div>
  );
}
