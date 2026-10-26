'use client';

import { useId } from 'react';

interface RevealPickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
}

// <input type="datetime-local"> speaks local wall-clock time without a zone;
// the database stores an absolute instant.
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Optional "don't open before" moment; until then the link shows a countdown. */
export function RevealPicker({ value, onChange }: RevealPickerProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        Unlock at (optional)
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="datetime-local"
          value={value ? toLocalInput(value) : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : null;
            if (!date || !Number.isNaN(date.getTime())) onChange(date ? date.toISOString() : null);
          }}
          className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="h-11 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Share the link early — until then it shows a countdown instead of the surprise.
      </p>
    </div>
  );
}
