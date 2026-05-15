import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' &&
            'bg-slate-950 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800',
          variant === 'secondary' && 'bg-slate-100 text-slate-950 hover:bg-slate-200',
          variant === 'outline' && 'border border-slate-200 bg-white hover:bg-slate-50',
          variant === 'ghost' && 'hover:bg-slate-100',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
