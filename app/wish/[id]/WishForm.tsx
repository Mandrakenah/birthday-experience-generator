'use client';

import { useState, type FormEvent } from 'react';
import { LIMITS } from '@/lib/utils/validation';
import { HeartIcon } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/Spinner';

const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200';

export function WishForm({ projectId, recipient }: { projectId: string; recipient: string }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — hidden from humans
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState('sending');
    const res = await fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name, message, website }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok) {
      setError(json?.error ?? 'Could not send — check your connection and try again');
      setState('idle');
      return;
    }
    setState('sent');
  }

  if (state === 'sent') {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-white/85 p-6 text-center text-slate-800 shadow-lg">
        <HeartIcon className="size-10 text-rose-500" />
        <p className="text-lg font-semibold">Your wish is in!</p>
        <p className="text-sm text-slate-600">
          {recipient} will see it inside their birthday card. Thanks for being part of it.
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage('');
            setState('idle');
          }}
          className="mt-1 text-sm font-medium text-violet-700 underline"
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex flex-col gap-4 rounded-2xl bg-white/85 p-5 text-left text-slate-800 shadow-lg sm:p-6"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Your name
        <input
          required
          value={name}
          maxLength={LIMITS.wishName}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
          className={`${fieldClass} h-11`}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Your wish
        <textarea
          required
          rows={4}
          value={message}
          maxLength={LIMITS.wishMessage}
          placeholder={`Happy birthday, ${recipient}!…`}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} py-2.5`}
        />
        <span className="self-end text-xs font-normal text-slate-400">
          {message.length}/{LIMITS.wishMessage}
        </span>
      </label>
      {/* Honeypot: off-screen and skipped by keyboard/screen readers. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <button
        type="submit"
        disabled={state === 'sending' || !name.trim() || !message.trim()}
        className="flex h-12 items-center justify-center rounded-full bg-violet-600 text-base font-semibold text-white hover:bg-violet-500 disabled:bg-violet-300"
      >
        {state === 'sending' ? <Spinner className="size-5" /> : 'Send my wish'}
      </button>
      {error && (
        <p role="alert" className="text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
