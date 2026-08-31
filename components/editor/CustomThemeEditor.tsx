'use client';

import { useEffect, useRef, useState } from 'react';
import { STICKERS, STICKER_KINDS } from '@/components/experience/Stickers';
import { createClient } from '@/lib/supabase/client';
import { buildStoragePath, validateFile } from '@/lib/utils/uploadHelpers';
import { fontClasses } from '@/lib/utils/themes';
import { cn } from '@/lib/utils/cn';
import type { CustomSticker, CustomTheme, FontFamily, StickerKind } from '@/types';

interface CustomThemeEditorProps {
  projectId: string;
  recipient: string;
  initial: CustomTheme;
  onSaveStart: () => void;
  onSaveEnd: (ok: boolean) => void;
}

const FONTS: Array<{ value: FontFamily; label: string }> = [
  { value: 'sans', label: 'Modern' },
  { value: 'serif', label: 'Classic' },
  { value: 'script', label: 'Handwritten' },
];

const SIZES: Array<{ value: number; label: string }> = [
  { value: 0.85, label: 'S' },
  { value: 1, label: 'M' },
  { value: 1.2, label: 'L' },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-gray-700">
      {label}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 cursor-pointer rounded border border-gray-300 bg-white"
      />
    </label>
  );
}

/** Full custom-page builder (custom theme): live canvas + drag-placed stickers. */
export function CustomThemeEditor({
  projectId,
  recipient,
  initial,
  onSaveStart,
  onSaveEnd,
}: CustomThemeEditorProps) {
  const [ct, setCt] = useState<CustomTheme>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgBusy, setBgBusy] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const firstRender = useRef(true);

  // The parent recreates onSaveStart/onSaveEnd on every render and both call
  // setState, so depending on them directly re-arms the save effect after each
  // save — an endless PATCH loop. Read them through a ref and key the effect on
  // the data alone.
  const callbacks = useRef({ onSaveStart, onSaveEnd });
  useEffect(() => {
    callbacks.current = { onSaveStart, onSaveEnd };
  });

  // Debounced auto-save of the whole custom_theme blob.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      callbacks.current.onSaveStart();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, custom_theme: ct }),
      });
      callbacks.current.onSaveEnd(res.ok);
    }, 700);
    return () => clearTimeout(timer);
  }, [ct, projectId]);

  // Drag via pointer capture on the sticker itself — events keep coming even
  // when the pointer leaves the element, so no window listeners are needed.
  function onStickerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    setSelectedId(id);
    dragId.current = id;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onStickerMove(e: React.PointerEvent, id: string) {
    if (dragId.current !== id) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = clamp01((e.clientX - r.left) / r.width);
    const y = clamp01((e.clientY - r.top) / r.height);
    setCt((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)),
    }));
  }

  function onStickerUp(e: React.PointerEvent, id: string) {
    if (dragId.current !== id) return;
    dragId.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const patch = (changes: Partial<CustomTheme>) => setCt((prev) => ({ ...prev, ...changes }));

  function addSticker(kind: StickerKind) {
    const sticker: CustomSticker = {
      id: crypto.randomUUID(),
      kind,
      x: 0.5,
      y: 0.4,
      size: 0.16,
    };
    setCt((prev) => ({ ...prev, stickers: [...prev.stickers, sticker] }));
    setSelectedId(sticker.id);
  }

  function updateSelected(changes: Partial<CustomSticker>) {
    if (!selectedId) return;
    setCt((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) => (s.id === selectedId ? { ...s, ...changes } : s)),
    }));
  }

  function removeSelected() {
    if (!selectedId) return;
    setCt((prev) => ({ ...prev, stickers: prev.stickers.filter((s) => s.id !== selectedId) }));
    setSelectedId(null);
  }

  async function onBgImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const invalid = validateFile(file, 'photo');
    if (invalid) {
      setBgError(invalid);
      return;
    }
    setBgError(null);
    setBgBusy(true);
    try {
      // Upload BEFORE patching. An object URL put into ct would be autosaved
      // into custom_theme and every recipient would get a dead background.
      // Deliberately no project_media row — that would add the background to
      // the photo slideshow.
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBgError('Not signed in');
        return;
      }
      const path = buildStoragePath(user.id, projectId, 'photo', file.name);
      const { error } = await supabase.storage
        .from('birthday-media')
        .upload(path, file, { contentType: file.type });
      if (error) {
        setBgError(error.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('birthday-media').getPublicUrl(path);
      patch({ backgroundImage: publicUrl });
    } catch {
      setBgError('Upload failed — try again');
    } finally {
      setBgBusy(false);
    }
  }

  const selected = ct.stickers.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* live canvas */}
      <div
        ref={canvasRef}
        onPointerDown={() => setSelectedId(null)}
        className="relative mx-auto aspect-[9/16] w-full max-w-[300px] touch-none overflow-hidden rounded-2xl border border-gray-300 shadow"
        style={{ background: `linear-gradient(135deg, ${ct.bgFrom}, ${ct.bgTo})` }}
      >
        {ct.backgroundImage && (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL / arbitrary host
          <img
            src={ct.backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: ct.backgroundOpacity }}
          />
        )}

        <div
          className={cn(
            'pointer-events-none relative z-10 flex h-full flex-col items-center justify-center gap-2 px-4 text-center',
            fontClasses[ct.fontFamily]
          )}
          style={{ color: ct.textColor }}
        >
          <p className="font-bold" style={{ fontSize: `${1.5 * ct.textScale}rem` }}>
            Happy Birthday
          </p>
          <p className="font-extrabold" style={{ fontSize: `${2.4 * ct.textScale}rem` }}>
            {recipient || 'Name'}
          </p>
        </div>

        {ct.stickers.map((s) => {
          const { Sticker } = STICKERS[s.kind];
          return (
            <button
              type="button"
              key={s.id}
              onPointerDown={(e) => onStickerDown(e, s.id)}
              onPointerMove={(e) => onStickerMove(e, s.id)}
              onPointerUp={(e) => onStickerUp(e, s.id)}
              className={cn(
                'absolute z-20 touch-none',
                selectedId === s.id && 'rounded ring-2 ring-white'
              )}
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                width: `${s.size * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Sticker className="pointer-events-none h-auto w-full" />
            </button>
          );
        })}
      </div>

      {/* selected sticker controls */}
      {selected && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-2">
          <span className="text-sm text-gray-700">Size</span>
          <input
            type="range"
            min={0.06}
            max={0.4}
            step={0.01}
            value={selected.size}
            onChange={(e) => updateSelected({ size: Number(e.target.value) })}
            className="flex-1"
          />
          <button
            type="button"
            onClick={removeSelected}
            className="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}

      {/* sticker tray */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Add stickers (drag to place)</span>
        <div className="flex flex-wrap gap-2">
          {STICKER_KINDS.map((kind) => {
            const { Sticker, label } = STICKERS[kind];
            return (
              <button
                key={kind}
                type="button"
                title={label}
                aria-label={`Add ${label}`}
                onClick={() => addSticker(kind)}
                className="flex size-11 items-center justify-center rounded-lg border border-gray-300 bg-white hover:border-violet-400"
              >
                <Sticker className="size-7" />
              </button>
            );
          })}
        </div>
      </div>

      {/* style controls */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ColorField label="Background top" value={ct.bgFrom} onChange={(v) => patch({ bgFrom: v })} />
        <ColorField label="Background bottom" value={ct.bgTo} onChange={(v) => patch({ bgTo: v })} />
        <ColorField label="Text color" value={ct.textColor} onChange={(v) => patch({ textColor: v })} />
        <ColorField label="Accent (candles)" value={ct.accentColor} onChange={(v) => patch({ accentColor: v })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Background photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={onBgImage}
          disabled={bgBusy}
          className="text-sm text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-violet-700 disabled:opacity-50"
        />
        {bgBusy && <span className="text-xs text-gray-500">Uploading…</span>}
        {bgError && <span className="text-xs text-red-600">{bgError}</span>}
        {ct.backgroundImage && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Opacity</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ct.backgroundOpacity}
              onChange={(e) => patch({ backgroundOpacity: Number(e.target.value) })}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => patch({ backgroundImage: null })}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Font
          <select
            value={ct.fontFamily}
            onChange={(e) => patch({ fontFamily: e.target.value as FontFamily })}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-700">Text size</span>
          {SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => patch({ textScale: s.value })}
              className={cn(
                'flex size-9 items-center justify-center rounded-lg border text-sm font-medium',
                ct.textScale === s.value
                  ? 'border-violet-600 bg-violet-50 text-violet-800'
                  : 'border-gray-300 bg-white text-gray-600'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
