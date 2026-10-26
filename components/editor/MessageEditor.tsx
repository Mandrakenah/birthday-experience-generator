'use client';

import { useId, useState } from 'react';
import { useAutosave } from '@/lib/hooks/useAutosave';
import { cn } from '@/lib/utils/cn';

interface MessageEditorProps {
  label: string;
  initialValue: string;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  onSave: (value: string, keepalive: boolean) => Promise<boolean>;
}

/** Textarea with character count; auto-saves while typing and on blur (spec 5.1/12.3). */
export function MessageEditor({
  label,
  initialValue,
  maxLength,
  rows = 3,
  placeholder,
  onSave,
}: MessageEditorProps) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const flush = useAutosave(value, onSave, 1000);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => flush()}
        className="rounded-lg border border-gray-300 bg-white p-3 text-base text-gray-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
      />
      <p
        className={cn(
          'self-end text-xs',
          value.length >= maxLength ? 'text-red-600' : 'text-gray-400'
        )}
      >
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
