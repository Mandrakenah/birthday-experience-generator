'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BirthdayProject } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface ProjectCardProps {
  project: BirthdayProject;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [copied, setCopied] = useState(false);

  const isPublished = project.status === 'published';
  const updated = new Date(project.updated_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  async function handleShare() {
    if (!project.slug) return;
    const url = `${window.location.origin}/b/${project.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
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

      <p className="text-sm text-gray-500">Last updated {updated}</p>

      <div className="mt-1 flex flex-wrap gap-2">
        <Link href={`/editor/${project.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            Edit
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={handleShare}
          disabled={!isPublished || !project.slug}
          title={isPublished ? 'Copy share link' : 'Publish first to share'}
        >
          {copied ? 'Copied!' : 'Share'}
        </Button>
        <Button
          variant="ghost"
          className="text-red-600 hover:bg-red-50"
          onClick={() => onDelete(project.id)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
