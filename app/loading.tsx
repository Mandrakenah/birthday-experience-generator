import { Spinner } from '@/components/ui/Spinner';

// Route-transition fallback (spec 5.3 — Spinner used during route transitions).
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center text-violet-600">
      <Spinner className="size-8" />
    </div>
  );
}
