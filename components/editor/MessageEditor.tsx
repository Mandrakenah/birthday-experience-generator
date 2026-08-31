'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface MessageEditorProps {
  projectId: string;
  field: 'message' | 'final_message';
  label: string;
  initialValue: string;
  maxLength: number;
  placeholder?: string;
  onSaveStart: () => void;
  onSaveEnd: (ok: boolean) => void;
}

/** Textarea with character count; auto-saves on blur via PATCH /api/projects (spec 5.1/12.3). */
export function MessageEditor({
  projectId,
  field,
  label,
  initialValue,
  maxLength,
  placeholder,
  onSaveStart,
  onSaveEnd,
}: MessageEditorProps) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [savedValue, setSavedValue] = useState(initialValue);

  async function handleBlur() {
    if (value === savedValue) return;
    onSaveStart();
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: projectId, [field]: value }),
    });
    if (res.ok) setSavedValue(value);
    onSaveEnd(res.ok);
  }

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
        rows={field === 'message' ? 5 : 3}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void handleBlur()}
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
