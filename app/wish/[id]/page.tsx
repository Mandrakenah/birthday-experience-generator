import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/utils/validation';
import { resolveTheme } from '@/lib/utils/resolveTheme';
import { cn } from '@/lib/utils/cn';
import { WishForm } from './WishForm';
import type { BirthdayProject } from '@/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// Friends usually get this link before the card is published, so it can't
// rely on the public-read RLS policy — the admin client reads just the few
// fields this page needs, and only while the creator has wishes switched on.
async function getWishTarget(id: string) {
  if (!isUuid(id)) return null;
  const { data } = await createAdminClient()
    .from('birthday_projects')
    .select('id, recipient, theme, custom_theme, font_family, wishes_enabled')
    .eq('id', id)
    .maybeSingle();
  return data?.wishes_enabled
    ? (data as Pick<BirthdayProject, 'id' | 'recipient' | 'theme' | 'custom_theme' | 'font_family'>)
    : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getWishTarget(id);
  const title = project?.recipient
    ? `Add a birthday wish for ${project.recipient}`
    : 'Add a birthday wish';
  return { title: { absolute: title }, robots: { index: false, follow: false } };
}

export default async function WishPage({ params }: Props) {
  const { id } = await params;
  const project = await getWishTarget(id);
  if (!project) notFound();

  const theme = resolveTheme(project);
  const name = project.recipient || 'the birthday person';

  return (
    <main
      className={cn('flex min-h-screen flex-1 items-center justify-center px-4 py-10', theme.className)}
      style={theme.style}
    >
      <div className="w-full max-w-md">
        <h1 className={cn('text-center text-3xl font-bold sm:text-4xl', theme.fontClass)}>
          A birthday surprise for {name}
        </h1>
        <p className="mt-2 text-center text-base opacity-80">
          Leave a short wish — it&apos;ll show up inside their birthday card. Shh, it&apos;s a
          surprise!
        </p>
        <WishForm projectId={project.id} recipient={name} />
      </div>
    </main>
  );
}
