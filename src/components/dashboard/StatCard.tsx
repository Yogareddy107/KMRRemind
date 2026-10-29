import React from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'indigo',
  onClick,
}) => {
  const colorStyles = {
    indigo: 'bg-matte-accent-subtle text-indigo-400 border border-indigo-500/20',
    emerald: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
    amber: 'bg-amber-950/40 text-amber-400 border border-amber-800/40',
    rose: 'bg-rose-950/40 text-rose-400 border border-rose-800/40',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3.5 rounded-xl border border-matte-border bg-matte-surface p-4 transition-all duration-150 shadow-matte-sm',
        onClick && 'cursor-pointer hover:border-matte-border-focus hover:bg-matte-elevated'
      )}
    >
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shadow-matte-sm', colorStyles[color])}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium tracking-tight text-slate-400">{label}</p>
        <h3 className="text-xl font-bold tracking-tight text-slate-100">{value}</h3>
        {trend && <p className="mt-0.5 text-[10px] text-slate-500">{trend}</p>}
      </div>
    </div>
  );
};
