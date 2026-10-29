import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
}) => {
  const variants = {
    default: 'bg-matte-subtle text-slate-300 border border-matte-border shadow-matte-sm',
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 shadow-matte-sm',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-800/50 shadow-matte-sm',
    danger: 'bg-rose-950/40 text-rose-300 border border-rose-800/50 shadow-matte-sm',
    info: 'bg-matte-accent-subtle text-indigo-300 border border-indigo-500/30 shadow-matte-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
