import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'h-11 rounded-lg border bg-white px-3 text-base text-slate-900 outline-none transition-colors',
          'focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
          error ? 'border-red-400' : 'border-slate-300',
          className
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
