// app/b/[slug]/page.tsx — public experience viewer (spec 17.1, Patch 3)
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ExperienceShell } from '@/components/experience/ExperienceShell';
import { RecordView } from '@/components/experience/RecordView';
import { RevealCountdown } from '@/components/experience/RevealCountdown';
import { getExperienceData, getPublishedProject } from '@/lib/data/experience';
import type { BirthdayProject } from '@/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

/** Milliseconds until the creator's chosen reveal, or 0 once it has passed. */
function msUntilReveal(project: BirthdayProject): number {
  if (!project.reveal_at) return 0;
  return Math.max(0, new Date(project.reveal_at).getTime() - Date.now());
}

// A published page carries someone's name, photos and a personal message. It is
// meant to be opened from a link the creator sent, not found in a search result,
// so keep these out of search indexes. The marketing pages stay indexable.
// The title/description only use the recipient's name, which is what makes the
// link preview in a chat app say who it's for — never the private message.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  const title = project?.recipient
    ? `Happy Birthday, ${project.recipient}!`
    : 'A birthday surprise';
  const description = 'Someone made you a birthday surprise. Turn your sound on and tap to open.';
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ExperiencePage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  // Scheduled reveal: send only the name + theme, so the photos and messages
  // can't be pulled out of the page before the moment the creator picked.
  const remaining = msUntilReveal(project);
  if (remaining > 0) {
    return <RevealCountdown project={project} msRemaining={remaining} />;
  }

  const data = await getExperienceData(project);
  return (
    <>
      <RecordView projectId={project.id} />
      <ExperienceShell data={data} />
    </>
  );
}
