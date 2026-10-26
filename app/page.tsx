import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  CakeIcon,
  CameraIcon,
  ClockIcon,
  MessageHeartIcon,
  MicIcon,
  SparklesIcon,
} from '@/components/ui/icons';
import { PhonePreview } from '@/components/marketing/PhonePreview';

const FEATURES: Array<{
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}> = [
  {
    Icon: CameraIcon,
    title: 'Their memories, beautifully told',
    body: 'Upload photos with captions and watch them become a cinematic slideshow with music.',
  },
  {
    Icon: MessageHeartIcon,
    title: 'Wishes from everyone',
    body: 'Send friends and family an invite link — their messages appear as a wall of love.',
  },
  {
    Icon: MicIcon,
    title: 'Blow out real candles',
    body: 'They blow into their microphone and the candles go out, one by one.',
  },
  {
    Icon: ClockIcon,
    title: 'Unlocks at midnight',
    body: 'Share the link early. Until the moment you pick, it shows a countdown.',
  },
  {
    Icon: SparklesIcon,
    title: 'Fireworks finale',
    body: 'A burst of fireworks and one last heartfelt message they will remember.',
  },
  {
    Icon: CakeIcon,
    title: 'Make it yours',
    body: 'Seven themes, or build your own with colors, a background photo and stickers.',
  },
];

const STEPS = [
  { title: 'Create', body: 'Add their name, your photos, a song and a message.' },
  { title: 'Personalize', body: 'Pick a theme, invite friends to add wishes, set the unlock time.' },
  { title: 'Share', body: 'Publish and send one link. No app or login on their side.' },
];

// Marketing landing page (spec 6.1) — public, sign-up CTA. Product-first showcase:
// professional light layout with the colorful experience previewed in-hero.
export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-white text-slate-900">
      {/* soft violet glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-violet-300/30 blur-3xl"
      />

      <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <span className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
          <CakeIcon className="size-5 text-violet-600" />
          Birthday Experience
        </span>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex h-11 items-center rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="flex h-11 items-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-4 py-12 md:grid-cols-2 md:py-16">
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            <SparklesIcon className="size-3.5" />
            Cinematic birthday websites
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            Give them a birthday they can step into
          </h1>
          <p className="max-w-md text-base text-slate-600 sm:text-lg">
            Photos, music, a video message, candles they blow out with their own breath,
            and fireworks to end it — all in one shareable link.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="flex h-12 items-center rounded-full bg-violet-600 px-7 text-base font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500"
            >
              Create a birthday experience →
            </Link>
            <Link
              href="#features"
              className="flex h-12 items-center rounded-full border border-slate-300 px-6 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              How it works
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            Free to start · No login needed for the birthday person.
          </p>
        </div>

        <PhonePreview />
      </section>

      <section id="features" className="relative mx-auto w-full max-w-5xl px-4 pb-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Everything a birthday deserves
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative border-y border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ready in minutes
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col items-center text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-violet-600 text-base font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 max-w-xs text-sm text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link
              href="/signup"
              className="flex h-12 items-center rounded-full bg-violet-600 px-7 text-base font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500"
            >
              Start your first surprise →
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <CakeIcon className="size-4 text-violet-600" />
          Birthday Experience
        </span>
        <nav className="flex gap-4">
          <Link href="/login" className="hover:text-slate-900">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-slate-900">
            Sign up
          </Link>
        </nav>
      </footer>
    </main>
  );
}
