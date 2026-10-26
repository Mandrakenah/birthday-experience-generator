'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/ui/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  const backToLogin = (
    <Link href="/login" className="font-medium text-violet-600 hover:underline">
      Back to log in
    </Link>
  );

  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`If an account exists for ${email.trim()}, a reset link is on its way. Open it on this device.`}
        footer={backToLogin}
      />
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={submitting || !email.trim()} className="mt-2 w-full">
          {submitting ? <Spinner className="size-4" /> : 'Send reset link'}
        </Button>
        {error && (
          <p role="alert" className="text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </AuthCard>
  );
}
