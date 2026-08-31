'use client';

import { themes } from '@/lib/utils/themes';
import { cn } from '@/lib/utils/cn';
import type { ThemeName } from '@/types';

interface ThemePickerProps {
  projectId: string;
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
  onSaveStart: () => void;
  onSaveEnd: (ok: boolean) => void;
}

/** Theme chips (spec 5.1) + a "Custom" chip; persists project.theme on click. */
export function ThemePicker({
  projectId,
  value,
  onChange,
  onSaveStart,
  onSaveEnd,
}: ThemePickerProps) {
  async function handlePick(theme: ThemeName) {
    if (theme === value) return;
    onChange(theme);
    onSaveStart();
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: projectId, theme }),
    });
    onSaveEnd(res.ok);
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-gray-700">Theme</legend>
      <div className="flex flex-wrap gap-2">
        {Object.values(themes).map((theme) => (
          <button
            key={theme.name}
            type="button"
            aria-pressed={value === theme.name}
            onClick={() => void handlePick(theme.name)}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors',
              value === theme.name
                ? 'border-violet-600 bg-violet-50 text-violet-800'
                : 'border-gray-300 bg-white text-gray-600 hover:border-violet-300'
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-5 rounded-full border border-black/10', theme.background)}
            />
            {theme.label}
          </button>
        ))}

        {/* Custom = build-your-own page (separate from the preset ThemeConfigs) */}
        <button
          type="button"
          aria-pressed={value === 'custom'}
          onClick={() => void handlePick('custom')}
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors',
            value === 'custom'
              ? 'border-violet-600 bg-violet-50 text-violet-800'
              : 'border-gray-300 bg-white text-gray-600 hover:border-violet-300'
          )}
        >
          <span
            aria-hidden="true"
            className="size-5 rounded-full border border-black/10 bg-[conic-gradient(from_0deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f87171)]"
          />
          Custom
        </button>
      </div>
    </fieldset>
  );
}
