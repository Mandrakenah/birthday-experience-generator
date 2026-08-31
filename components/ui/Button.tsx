import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-violet-600 text-white hover:bg-violet-500 disabled:bg-violet-300',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        // h-11 = 44px — minimum tap target (spec 19.3)
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
