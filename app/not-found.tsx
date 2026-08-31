import Link from 'next/link';
import { CakeIcon } from '@/components/ui/icons';

// Global 404 for unknown routes (the experience viewer has its own at
// app/b/[slug]/not-found.tsx, spec 20.2).
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
        <CakeIcon className="size-8" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-500"
      >
        Go home
      </Link>
    </main>
  );
}
