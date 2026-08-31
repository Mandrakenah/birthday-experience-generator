'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { BirthdayProject, ProjectMedia, ThemeName, FontFamily } from '@/types';
import { MediaUploader } from '@/components/editor/MediaUploader';
import { PhotoReorder } from '@/components/editor/PhotoReorder';
import { MessageEditor } from '@/components/editor/MessageEditor';
import { ThemePicker } from '@/components/editor/ThemePicker';
import { FontPicker } from '@/components/editor/FontPicker';
import { CustomThemeEditor } from '@/components/editor/CustomThemeEditor';
import { DEFAULT_CUSTOM_THEME } from '@/lib/utils/themes';
import { PreviewButton } from '@/components/editor/PreviewButton';
import { ShareModal } from '@/components/editor/ShareModal';
import { PublishToggle } from '@/components/editor/PublishToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { MusicIcon, VideoIcon } from '@/components/ui/icons';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [project, setProject] = useState<BirthdayProject | null>(null);
  const [media, setMedia] = useState<ProjectMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [recipient, setRecipient] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const [{ data: proj }, { data: mediaRows }] = await Promise.all([
        supabase.from('birthday_projects').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('project_media')
          .select('*')
          .eq('project_id', id)
          .order('sort_order', { ascending: true }),
      ]);
      if (cancelled) return;
      setProject(proj as BirthdayProject | null);
      setRecipient((proj as BirthdayProject | null)?.recipient ?? '');
      setMedia((mediaRows as ProjectMedia[]) ?? []);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const photos = media.filter((m) => m.type === 'photo');
  const music = media.find((m) => m.type === 'music') ?? null;
  const video = media.find((m) => m.type === 'video') ?? null;

  const onSaveStart = () => setSaveState('saving');
  const onSaveEnd = (ok: boolean) => setSaveState(ok ? 'saved' : 'error');

  async function saveRecipient() {
    if (!project || recipient === project.recipient) return;
    onSaveStart();
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, recipient }),
    });
    if (res.ok) setProject((p) => (p ? { ...p, recipient } : p));
    onSaveEnd(res.ok);
  }

  function refreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  function handleUploaded(item: ProjectMedia) {
    setMedia((m) =>
      // music/video are single-file: a new upload replaces the previous entry in the UI
      item.type === 'photo' ? [...m, item] : [...m.filter((x) => x.type !== item.type), item]
    );
    refreshPreview();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-violet-600">
        <Spinner className="size-8" />
      </div>
    );
  }

  // RLS returns no row for projects the user doesn't own (spec 20.1) — empty state.
  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Project not found</h1>
        <p className="text-sm text-gray-500">
          It may have been deleted, or it belongs to another account.
        </p>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const canPublish = recipient.trim().length > 0 && photos.length > 0;
  const shareUrl = project.slug ? `${window.location.origin}/b/${project.slug}` : '';

  return (
    <div className="min-h-screen flex-1 bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="shrink-0 text-sm text-violet-600 hover:underline">
              ← Dashboard
            </Link>
            <h1 className="truncate text-lg font-semibold text-gray-900">
              {recipient || 'Untitled birthday'}
            </h1>
            <span className="shrink-0 text-xs text-gray-400" aria-live="polite">
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && 'Saved'}
              {saveState === 'error' && <span className="text-red-500">Save failed</span>}
            </span>
          </div>
          <div className="hidden md:block">
            <PreviewButton projectId={id} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-2">
        {/* Left pane — settings (spec 12.2) */}
        <div className="flex flex-col gap-6">
          <Input
            label="Recipient name"
            value={recipient}
            placeholder="Who's this birthday for?"
            onChange={(e) => setRecipient(e.target.value)}
            onBlur={() => void saveRecipient()}
          />

          <ThemePicker
            projectId={id}
            value={project.theme}
            onChange={(theme: ThemeName) => {
              setProject({ ...project, theme });
              refreshPreview();
            }}
            onSaveStart={onSaveStart}
            onSaveEnd={onSaveEnd}
          />

          {project.theme === 'custom' && (
            <CustomThemeEditor
              projectId={id}
              recipient={recipient}
              initial={project.custom_theme ?? DEFAULT_CUSTOM_THEME}
              onSaveStart={onSaveStart}
              onSaveEnd={(ok) => {
                onSaveEnd(ok);
                refreshPreview();
              }}
            />
          )}

          <MessageEditor
            projectId={id}
            field="message"
            label="Personal message"
            initialValue={project.message}
            maxLength={500}
            placeholder="Write something from the heart…"
            onSaveStart={onSaveStart}
            onSaveEnd={(ok) => {
              onSaveEnd(ok);
              refreshPreview();
            }}
          />

          <MessageEditor
            projectId={id}
            field="final_message"
            label="Final ending message (shown after the fireworks)"
            initialValue={project.final_message}
            maxLength={200}
            placeholder="One last wish to end the experience…"
            onSaveStart={onSaveStart}
            onSaveEnd={(ok) => {
              onSaveEnd(ok);
              refreshPreview();
            }}
          />

          <FontPicker
            projectId={id}
            value={project.font_family}
            onChange={(font: FontFamily) => {
              setProject({ ...project, font_family: font });
              refreshPreview();
            }}
            onSaveStart={onSaveStart}
            onSaveEnd={onSaveEnd}
          />

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-700">Photos</h2>
            <MediaUploader
              projectId={id}
              type="photo"
              multiple
              nextSortOrder={
                // max+1, not length: deleting a photo would otherwise reissue a
                // sort_order already in use and scramble the slideshow.
                photos.length ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0
              }
              onUploaded={handleUploaded}
            />
            <PhotoReorder
              photos={photos}
              onReorder={(next) => {
                setMedia((m) => [...m.filter((x) => x.type !== 'photo'), ...next]);
                refreshPreview();
              }}
              onRemoved={(photoId) => {
                setMedia((m) => m.filter((x) => x.id !== photoId));
                refreshPreview();
              }}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-700">Background music</h2>
            {music && (
              <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                <MusicIcon className="size-3.5 shrink-0" />
                {music.storage_path.split('/').pop()}
              </p>
            )}
            <MediaUploader projectId={id} type="music" onUploaded={handleUploaded} />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-700">Video message</h2>
            {video && (
              <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                <VideoIcon className="size-3.5 shrink-0" />
                {video.storage_path.split('/').pop()}
              </p>
            )}
            <MediaUploader projectId={id} type="video" onUploaded={handleUploaded} />
          </section>

          <section className="flex flex-col gap-3">
            <PublishToggle
              projectId={id}
              isPublished={project.status === 'published'}
              canPublish={canPublish}
              onPublished={(slug) => {
                setProject({ ...project, slug, status: 'published' });
                setShareOpen(true);
              }}
              onUnpublished={() => setProject({ ...project, status: 'draft' })}
            />
            {project.status === 'published' && project.slug && (
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                Share link
              </Button>
            )}
          </section>
        </div>

        {/* Right pane — live preview (hidden on mobile, spec 12.2) */}
        <div className="hidden md:flex md:flex-col md:gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Live preview</h2>
            <Button variant="ghost" onClick={refreshPreview}>
              ⟳ Refresh
            </Button>
          </div>
          <div className="sticky top-20 aspect-[9/16] max-h-[75vh] overflow-hidden rounded-2xl border border-gray-300 bg-black shadow-lg">
            <iframe
              key={previewKey}
              src={`/editor/${id}/preview`}
              title="Experience preview"
              className="size-full"
            />
          </div>
        </div>
      </main>

      {/* Floating preview button on mobile (spec 12.2) */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <PreviewButton projectId={id} />
      </div>

      <ShareModal open={shareOpen} url={shareUrl} onClose={() => setShareOpen(false)} />
    </div>
  );
}
