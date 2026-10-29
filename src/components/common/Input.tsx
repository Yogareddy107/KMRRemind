import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-lg border bg-matte-input px-3.5 py-2 text-xs font-normal text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-1 focus:ring-matte-accent',
              icon ? 'pl-9' : '',
              error
                ? 'border-rose-800/80 focus:border-rose-500 focus:ring-rose-500'
                : 'border-matte-border focus:border-matte-border-focus hover:border-matte-border-focus',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
