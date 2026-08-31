import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { CakeIcon, CameraIcon, MicIcon, SparklesIcon } from '@/components/ui/icons';
import { PhonePreview } from '@/components/marketing/PhonePreview';

const FEATURES: Array<{
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}> = [
  {
    Icon: CameraIcon,
    title: 'Their memories, beautifully told',
    body: 'Upload photos and watch them become a cinematic slideshow with music.',
  },
  {
    Icon: MicIcon,
    title: 'Blow out real candles',
    body: 'They blow into their microphone and the candles go out, one by one.',
  },
  {
    Icon: SparklesIcon,
    title: 'Fireworks finale',
    body: 'A burst of fireworks and one last heartfelt message they will remember.',
  },
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

      <section
        id="features"
        className="relative mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 pb-20 sm:grid-cols-3"
      >
        {FEATURES.map(({ Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Icon className="size-6" />
            </span>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
