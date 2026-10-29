import React from 'react';
import { CalendarX2 } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-matte-border bg-matte-surface/40">
      <div className="p-3 bg-matte-elevated text-matte-accent rounded-xl mb-3 border border-matte-border shadow-matte-sm">
        {icon || <CalendarX2 className="w-6 h-6 text-indigo-400" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-200 tracking-tight">{title}</h4>
      <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
