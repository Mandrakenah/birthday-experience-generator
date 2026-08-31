import Link from 'next/link';
import { GiftIcon } from '@/components/ui/icons';

// Spec 20.2 — friendly 404 for invalid/unpublished slugs.
export default function ExperienceNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-white/70 text-purple-500">
        <GiftIcon className="size-8" />
      </span>
      <h1 className="text-2xl font-bold text-purple-900">
        This birthday card couldn&apos;t be found.
      </h1>
      <p className="max-w-sm text-sm text-purple-900/70">
        It may have expired or the link is wrong. Double-check the link you were sent.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700"
      >
        Create your own
      </Link>
    </main>
  );
}
