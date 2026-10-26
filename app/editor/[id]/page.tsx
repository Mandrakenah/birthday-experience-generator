'use client';

import { use, useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { BirthdayProject, CustomTheme, FontFamily, ProjectMedia, ThemeName } from '@/types';
import { MediaUploader } from '@/components/editor/MediaUploader';
import { PhotoReorder } from '@/components/editor/PhotoReorder';
import { MessageEditor } from '@/components/editor/MessageEditor';
import { ThemePicker } from '@/components/editor/ThemePicker';
import { FontPicker } from '@/components/editor/FontPicker';
import { CustomThemeEditor } from '@/components/editor/CustomThemeEditor';
import { RevealPicker } from '@/components/editor/RevealPicker';
import { WishesManager } from '@/components/editor/WishesManager';
import { PreviewButton } from '@/components/editor/PreviewButton';
import { ShareModal } from '@/components/editor/ShareModal';
import { PublishToggle } from '@/components/editor/PublishToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { MusicIcon, VideoIcon, XIcon } from '@/components/ui/icons';
import { useAutosave } from '@/lib/hooks/useAutosave';
import { patchProject } from '@/lib/utils/patchProject';
import { sanitizeCustomTheme, LIMITS } from '@/lib/utils/validation';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Loaded {
  project: BirthdayProject;
  media: ProjectMedia[];
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loaded, setLoaded] = useState<Loaded | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoaded(null);
        return;
      }
      // creator_id filter: RLS alone would also return someone else's
      // *published* project here, which would then fail every save.
      const [{ data: proj }, { data: mediaRows }] = await Promise.all([
        supabase
          .from('birthday_projects')
          .select('*')
          .eq('id', id)
          .eq('creator_id', user.id)
          .maybeSingle(),
        supabase
          .from('project_media')
          .select('*')
          .eq('project_id', id)
          .order('sort_order', { ascending: true }),
      ]);
      if (cancelled) return;
      setLoaded(
        proj ? { project: proj as BirthdayProject, media: (mediaRows as ProjectMedia[]) ?? [] } : null
      );
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loaded === undefined) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center text-violet-600">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (loaded === null) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Project not found</h1>
        <p className="text-sm text-gray-500">
          It may have been deleted, or it belongs to another account.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <Editor initialProject={loaded.project} initialMedia={loaded.media} />;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

/** "1700000000000-my-song.mp3" → "my-song.mp3" (see buildStoragePath). */
const displayName = (m: ProjectMedia) => m.storage_path.split('/').pop()?.replace(/^\d+-/, '') ?? '';

function Editor({
  initialProject,
  initialMedia,
}: {
  initialProject: BirthdayProject;
  initialMedia: ProjectMedia[];
}) {
  const id = initialProject.id;
  const [project, setProject] = useState(initialProject);
  const [media, setMedia] = useState(initialMedia);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [recipient, setRecipient] = useState(initialProject.recipient);
  const [candles, setCandles] = useState(initialProject.candle_count ?? 5);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const refreshPreview = () => setPreviewKey((k) => k + 1);

  const save = useCallback(
    async (fields: Partial<BirthdayProject>, keepalive = false) => {
      // Optimistic: controls reflect the change immediately; a failure shows
      // in the header and is retried by the next edit.
      setProject((p) => ({ ...p, ...fields }));
      setSaveState('saving');
      const ok = await patchProject(id, fields, { keepalive });
      setSaveState(ok ? 'saved' : 'error');
      if (ok) setPreviewKey((k) => k + 1);
      return ok;
    },
    [id]
  );

  const flushRecipient = useAutosave(recipient, (v, keepalive) => save({ recipient: v }, keepalive));
  useAutosave(candles, (v, keepalive) => save({ candle_count: v }, keepalive), 500);

  const photos = media.filter((m) => m.type === 'photo');
  const music = media.find((m) => m.type === 'music') ?? null;
  const video = media.find((m) => m.type === 'video') ?? null;
  // Columns from migration 0004 are simply absent on older databases. Key on
  // wishes_enabled: candle_count already existed (hand-added) in production.
  const hasExtras = initialProject.wishes_enabled !== undefined;

  function handleUploaded(item: ProjectMedia) {
    setMedia((m) =>
      // music/video are single-file: a new upload replaces the previous entry in the UI
      item.type === 'photo' ? [...m, item] : [...m.filter((x) => x.type !== item.type), item]
    );
    refreshPreview();
  }

  /** Deletes the row, then the file. Returns an error message or null. */
  async function removeMedia(item: ProjectMedia): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.from('project_media').delete().eq('id', item.id);
    if (error) return error.message;
    await supabase.storage.from('birthday-media').remove([item.storage_path]);
    setMedia((m) => m.filter((x) => x.id !== item.id));
    refreshPreview();
    return null;
  }

  const canPublish = recipient.trim().length > 0 && photos.length > 0;
  const isPublished = project.status === 'published';
  const shareUrl = project.slug ? `${window.location.origin}/b/${project.slug}` : '';

  return (
    <div className="min-h-screen flex-1 bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
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
              {saveState === 'error' && <span className="text-red-500">Save failed — retrying on next edit</span>}
            </span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {isPublished && project.slug && (
              <Button variant="ghost" onClick={() => setShareOpen(true)}>
                Share
              </Button>
            )}
            <PreviewButton projectId={id} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-2">
        {/* Left pane — settings (spec 12.2) */}
        <div className="flex flex-col gap-6">
          <Section title="The basics">
            <Input
              label="Recipient name"
              value={recipient}
              maxLength={LIMITS.recipient}
              placeholder="Who's this birthday for?"
              onChange={(e) => setRecipient(e.target.value)}
              onBlur={() => flushRecipient()}
            />

            <ThemePicker
              value={project.theme}
              onChange={(theme: ThemeName) => void save({ theme })}
            />

            {project.theme === 'custom' ? (
              <CustomThemeEditor
                projectId={id}
                recipient={recipient}
                initial={sanitizeCustomTheme(project.custom_theme)}
                onSave={(custom_theme: CustomTheme, keepalive) => save({ custom_theme }, keepalive)}
              />
            ) : (
              // The custom builder has its own font control; this one drives presets.
              <FontPicker
                value={project.font_family}
                onChange={(font_family: FontFamily) => void save({ font_family })}
              />
            )}
          </Section>

          <Section title="Messages">
            <MessageEditor
              label="Personal message"
              initialValue={project.message}
              maxLength={LIMITS.message}
              rows={5}
              placeholder="Write something from the heart…"
              onSave={(message, keepalive) => save({ message }, keepalive)}
            />
            <MessageEditor
              label="Final ending message (shown after the fireworks)"
              initialValue={project.final_message}
              maxLength={LIMITS.finalMessage}
              placeholder="One last wish to end the experience…"
              onSave={(final_message, keepalive) => save({ final_message }, keepalive)}
            />
          </Section>

          <Section title="Photos">
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
              onCaptionSaved={(photoId, caption) => {
                setMedia((m) => m.map((x) => (x.id === photoId ? { ...x, caption } : x)));
                refreshPreview();
              }}
              onRemove={removeMedia}
            />
          </Section>

          <Section title="Music & video">
            <MediaSlot
              label="Background music"
              item={music}
              icon={<MusicIcon className="size-4 shrink-0" />}
              onRemove={removeMedia}
            >
              {music && <audio src={music.public_url} controls preload="none" className="w-full" />}
              <MediaUploader projectId={id} type="music" onUploaded={handleUploaded} />
            </MediaSlot>
            <MediaSlot
              label="Video message"
              item={video}
              icon={<VideoIcon className="size-4 shrink-0" />}
              onRemove={removeMedia}
            >
              {video && (
                <video
                  src={video.public_url}
                  controls
                  preload="metadata"
                  playsInline
                  className="max-h-64 w-full rounded-lg bg-black"
                />
              )}
              <MediaUploader projectId={id} type="video" onUploaded={handleUploaded} />
            </MediaSlot>
          </Section>

          {hasExtras && (
            <Section title="Extras">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="candles" className="flex justify-between text-sm font-medium text-gray-700">
                  Candles on the cake <span className="text-gray-500">{candles}</span>
                </label>
                <input
                  id="candles"
                  type="range"
                  min={1}
                  max={10}
                  value={candles}
                  onChange={(e) => setCandles(Number(e.target.value))}
                  className="accent-violet-600"
                />
              </div>
              <RevealPicker
                value={project.reveal_at ?? null}
                onChange={(reveal_at) => void save({ reveal_at })}
              />
              <WishesManager
                projectId={id}
                enabled={project.wishes_enabled ?? false}
                onToggle={(wishes_enabled) => void save({ wishes_enabled })}
              />
            </Section>
          )}

          <section className="flex flex-col gap-3">
            <PublishToggle
              projectId={id}
              isPublished={isPublished}
              canPublish={canPublish}
              onPublished={(slug) => {
                setProject((p) => ({ ...p, slug, status: 'published' }));
                setShareOpen(true);
              }}
              onUnpublished={() => setProject((p) => ({ ...p, status: 'draft' }))}
            />
            {isPublished && project.slug && (
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                Share link
              </Button>
            )}
          </section>
        </div>

        {/* Right pane — live preview (hidden on mobile, spec 12.2) */}
        <div className="hidden md:flex md:flex-col md:gap-2">
          <div className="sticky top-20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Live preview</h2>
              <Button variant="ghost" onClick={refreshPreview}>
                ⟳ Restart
              </Button>
            </div>
            <div className="mx-auto aspect-[9/16] h-[75vh] max-w-full overflow-hidden rounded-[2rem] border-[6px] border-gray-900 bg-black shadow-xl">
              <iframe
                key={previewKey}
                src={`/editor/${id}/preview`}
                title="Experience preview"
                allow="autoplay; microphone"
                className="size-full"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating preview button on mobile (spec 12.2) */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <PreviewButton projectId={id} />
      </div>

      <ShareModal
        open={shareOpen}
        url={shareUrl}
        recipient={recipient}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

function MediaSlot({
  label,
  item,
  icon,
  onRemove,
  children,
}: {
  label: string;
  item: ProjectMedia | null;
  icon: ReactNode;
  onRemove: (item: ProjectMedia) => Promise<string | null>;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        {item && (
          <button
            type="button"
            onClick={async () => setError(await onRemove(item))}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <XIcon className="size-3.5" />
            Remove
          </button>
        )}
      </div>
      {item && (
        <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
          {icon}
          {displayName(item)}
        </p>
      )}
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
