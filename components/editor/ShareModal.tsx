'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SparklesIcon } from '@/components/ui/icons';

interface ShareModalProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

/** Modal showing the published URL with copy-to-clipboard (spec 5.1). */
export function ShareModal({ open, url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share your birthday experience"
      onClick={onClose}
    >
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <SparklesIcon className="size-5 text-violet-600" />
          It&apos;s live!
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Send this link to the birthday person. No login needed on their side.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700"
          />
          <Button onClick={() => void handleCopy()} className="shrink-0">
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
