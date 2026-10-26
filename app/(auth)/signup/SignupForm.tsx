'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/ui/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { LIMITS } from '@/lib/utils/validation';

const MIN_PASSWORD = 8;

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        // No profile table in the schema — the optional default recipient
        // name (spec 10.1) lives in auth user metadata.
        data: recipientName.trim() ? { default_recipient: recipientName.trim() } : undefined,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // With "Confirm email" on, Supabase returns a user but no session until
    // the emailed link is clicked.
    if (!data.session) {
      setCheckEmail(true);
      setSubmitting(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  if (checkEmail) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${email.trim()}. Open it on this device to finish signing up.`}
        footer={
          <Link href="/login" className="font-medium text-violet-600 hover:underline">
            Back to log in
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Build a cinematic birthday surprise for someone special."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-violet-600 hover:underline">
            Log in
          </Link>
        </>
      }
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
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={
            confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined
          }
        />
        <Input
          label="Who's the birthday for? (optional)"
          type="text"
          placeholder="e.g. Mom, Alex…"
          maxLength={LIMITS.recipient}
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />

        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? <Spinner className="size-4" /> : 'Sign up'}
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
