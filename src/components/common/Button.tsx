import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-matte-accent focus:ring-offset-1 focus:ring-offset-matte-bg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] tracking-tight';

  const variants = {
    primary:
      'bg-matte-accent hover:bg-matte-accent-hover text-white shadow-matte-sm border border-indigo-400/20',
    secondary:
      'bg-matte-elevated hover:bg-matte-subtle text-slate-200 border border-matte-border hover:border-matte-border-focus',
    danger:
      'bg-rose-600/90 hover:bg-rose-600 text-white shadow-matte-sm border border-rose-500/30',
    outline:
      'border border-matte-border bg-matte-surface/80 hover:bg-matte-elevated text-slate-300 hover:text-white hover:border-matte-border-focus',
    ghost:
      'text-slate-400 hover:text-slate-200 hover:bg-matte-elevated',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs font-semibold px-3.5 py-2 gap-2',
    lg: 'text-sm font-semibold px-4 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-current" /> : icon}
      {children}
    </button>
  );
};
