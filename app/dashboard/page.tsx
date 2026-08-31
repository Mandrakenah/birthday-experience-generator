'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { BirthdayProject } from '@/types';
import { ProjectCard } from '@/components/editor/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CakeIcon, SparklesIcon } from '@/components/ui/icons';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [projects, setProjects] = useState<BirthdayProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      // Proxy already redirects unauthenticated visitors; this is a fallback.
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email ?? null);

      const { data, error: listError } = await supabase
        .from('birthday_projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (cancelled) return;

      if (listError) setError(listError.message);
      else setProjects(data as BirthdayProject[]);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleNew() {
    setCreating(true);
    setError(null);
    const res = await fetch('/api/projects', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Could not create project');
      setCreating(false);
      return;
    }
    router.push(`/editor/${json.project.id}`);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this birthday experience? This cannot be undone.')) {
      return;
    }
    const previous = projects;
    setProjects((p) => p.filter((proj) => proj.id !== id));
    const res = await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setProjects(previous);
      const json = await res.json().catch(() => null);
      setError(json?.error ?? 'Could not delete project');
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex-1 bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <span className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
            <CakeIcon className="size-5 text-violet-600" />
            Birthday Experience
          </span>
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden text-sm text-gray-500 sm:inline">{email}</span>
            )}
            <Button variant="ghost" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Your birthday experiences
          </h1>
          {projects.length > 0 && (
            <Button onClick={handleNew} disabled={creating}>
              {creating ? <Spinner className="size-4" /> : '+ New birthday'}
            </Button>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-24 text-violet-600">
            <Spinner className="size-8" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <SparklesIcon className="size-8" />
            </span>
            <h2 className="text-xl font-semibold text-gray-900">
              No birthday experiences yet
            </h2>
            <p className="max-w-sm text-sm text-gray-500">
              Create your first cinematic birthday surprise — add photos, music, a
              video message, and candles to blow out.
            </p>
            <Button onClick={handleNew} disabled={creating} className="mt-2">
              {creating ? <Spinner className="size-4" /> : '+ New birthday'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
