'use client';

import { useId } from 'react';
import type { FontFamily } from '@/types';

interface FontPickerProps {
  projectId: string;
  value: FontFamily;
  onChange: (font: FontFamily) => void;
  onSaveStart: () => void;
  onSaveEnd: (ok: boolean) => void;
}

const FONTS: Array<{ value: FontFamily; label: string }> = [
  { value: 'sans', label: 'Modern (sans-serif)' },
  { value: 'serif', label: 'Classic (serif)' },
  { value: 'script', label: 'Handwritten (script)' },
];

/** Optional font select for the message display (spec 5.1). */
export function FontPicker({
  projectId,
  value,
  onChange,
  onSaveStart,
  onSaveEnd,
}: FontPickerProps) {
  const id = useId();

  async function handleChange(font: FontFamily) {
    onChange(font);
    onSaveStart();
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: projectId, font_family: font }),
    });
    onSaveEnd(res.ok);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        Message font
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => void handleChange(e.target.value as FontFamily)}
        className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
      >
        {FONTS.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>
    </div>
  );
}
