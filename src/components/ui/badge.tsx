import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'green' | 'red' | 'amber';
};

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'default' && 'bg-slate-100 text-slate-700',
        tone === 'green' && 'bg-emerald-50 text-emerald-700',
        tone === 'red' && 'bg-red-50 text-red-700',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        className
      )}
      {...props}
    />
  );
}
