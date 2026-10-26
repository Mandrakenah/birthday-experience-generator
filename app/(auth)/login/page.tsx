import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import { safeNextPath } from '@/lib/utils/validation';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={safeNextPath(next)}
      notice={
        error === 'link' ? 'That link has expired or was already used. Log in, or request a new one.' : null
      }
    />
  );
}
