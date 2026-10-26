'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShareIcon, SparklesIcon } from '@/components/ui/icons';
import { copyText } from '@/lib/utils/clipboard';

interface ShareModalProps {
  open: boolean;
  url: string;
  recipient: string;
  onClose: () => void;
}

const linkClass =
  'inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50';

/** Modal showing the published URL with copy / share shortcuts (spec 5.1). */
export function ShareModal({ open, url, recipient, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const text = `I made something for your birthday${recipient ? `, ${recipient}` : ''}! Open it with the sound on:`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function handleCopy() {
    setCopied(await copyText(url));
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: 'A birthday surprise', text, url });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
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
          Send this link to the birthday person. No login needed on their side — tell them to
          turn the sound on.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            aria-label="Share link"
            onFocus={(e) => e.target.select()}
            className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700"
          />
          <Button onClick={() => void handleCopy()} className="shrink-0">
            {copied === true ? 'Copied!' : copied === false ? 'Copy failed' : 'Copy'}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {canNativeShare && (
            <Button variant="secondary" className="flex-1" onClick={() => void handleNativeShare()}>
              <ShareIcon className="size-4" />
              Share…
            </Button>
          )}
          <a
            className={linkClass}
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
          <a
            className={linkClass}
            href={`mailto:?subject=${encodeURIComponent('A birthday surprise for you')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`}
          >
            Email
          </a>
          <a className={linkClass} href={url} target="_blank" rel="noopener noreferrer">
            Open
          </a>
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
