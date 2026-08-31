'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // No profile table in the schema — the optional default recipient
        // name (spec 10.1) lives in auth user metadata.
        data: recipientName ? { default_recipient: recipientName } : undefined,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build a cinematic birthday surprise for someone special.
        </p>

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
            minLength={6}
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
              confirmPassword && password !== confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
          />
          <Input
            label="Who's the birthday for? (optional)"
            type="text"
            placeholder="e.g. Mom, Alex…"
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

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-violet-600 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
