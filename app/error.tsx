'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { SparklesIcon } from '@/components/ui/icons';

// Route error boundary (spec Section 20 — graceful error handling).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
        <SparklesIcon className="size-8" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">Something went sideways</h1>
      <p className="max-w-sm text-sm text-slate-500">
        An unexpected error occurred. Try again — if it keeps happening, refresh the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
