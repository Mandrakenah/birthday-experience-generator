'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BirthdayProject } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ClockIcon, EyeIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import { copyText } from '@/lib/utils/clipboard';
import { resolveTheme } from '@/lib/utils/resolveTheme';

interface ProjectCardProps {
  project: BirthdayProject;
  /** Undefined while loading or for unpublished projects. */
  views?: number;
  /** Timestamp the list was loaded at, for "opens on" badges. */
  now: number;
  onDelete: (id: string) => void;
}

const dateFormat: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

export function ProjectCard({ project, views, now, onDelete }: ProjectCardProps) {
  const [copied, setCopied] = useState<boolean | null>(null);

  const isPublished = project.status === 'published';
  const theme = resolveTheme(project);
  const updated = new Date(project.updated_at).toLocaleDateString(undefined, dateFormat);
  const revealAt = project.reveal_at ? new Date(project.reveal_at) : null;
  const upcomingReveal = revealAt && revealAt.getTime() > now ? revealAt : null;

  async function handleShare() {
    if (!project.slug) return;
    setCopied(await copyText(`${window.location.origin}/b/${project.slug}`));
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className={cn('h-16 border-b border-black/5', theme.className)}
        style={theme.style}
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            {project.recipient || 'Untitled birthday'}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            )}
          >
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>Updated {updated}</span>
          {isPublished && views !== undefined && (
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="size-4" />
              {views} {views === 1 ? 'view' : 'views'}
            </span>
          )}
          {upcomingReveal && (
            <span className="inline-flex items-center gap-1 text-violet-700">
              <ClockIcon className="size-4" />
              Opens {upcomingReveal.toLocaleDateString(undefined, dateFormat)}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          <Link
            href={`/editor/${project.id}`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          {isPublished && project.slug && (
            <a
              href={`/b/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              View
            </a>
          )}
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => void handleShare()}
            disabled={!isPublished || !project.slug}
            title={isPublished ? 'Copy share link' : 'Publish first to share'}
          >
            {copied === true ? 'Copied!' : copied === false ? 'Copy failed' : 'Share'}
          </Button>
          <Button
            variant="ghost"
            className="px-3 text-red-600 hover:bg-red-50"
            onClick={() => onDelete(project.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
