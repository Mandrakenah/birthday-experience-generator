import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { CakeIcon } from '@/components/ui/icons';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for the login / signup / password pages. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-slate-50 px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 hover:text-violet-700"
      >
        <CakeIcon className="size-5 text-violet-600" />
        Birthday Experience
      </Link>
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
      </Card>
    </main>
  );
}
