'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/ui/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

const MIN_PASSWORD = 8;

// Reached from the emailed reset link via /auth/callback, which has already
// signed the user in — so updateUser() can set the new password directly.
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(
        updateError.name === 'AuthSessionMissingError'
          ? 'Your reset link has expired. Request a new one.'
          : updateError.message
      );
      setSubmitting(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something you haven't used here before."
      footer={
        <Link href="/forgot-password" className="font-medium text-violet-600 hover:underline">
          Request a new link
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? <Spinner className="size-4" /> : 'Update password'}
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
