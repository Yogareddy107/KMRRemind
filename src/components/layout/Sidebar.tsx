import React from 'react';
import { NavView } from '../../types';
import { useReminders } from '../../context/ReminderContext';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Calendar,
  CheckCircle2,
  Settings,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isAdminUnlocked?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isAdminUnlocked,
}) => {
  const { occurrences } = useReminders();

  const now = Date.now();
  const pendingCount = occurrences.filter((o) => o.status === 'pending' || o.status === 'alerting' || o.status === 'snoozed').length;
  const overdueCount = occurrences.filter(
    (o) => (o.status === 'pending' || o.status === 'alerting') && new Date(o.scheduled_at).getTime() < now
  ).length;
  const completedCount = occurrences.filter((o) => o.status === 'completed').length;

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'all' as NavView,
      label: 'All Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'upcoming' as NavView,
      label: 'Upcoming',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'calendar' as NavView,
      label: 'Calendar',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'completed' as NavView,
      label: 'Completed',
      icon: <CheckCircle2 className="w-4 h-4" />,
      badge: completedCount > 0 ? completedCount : undefined,
    },
    {
      id: 'settings' as NavView,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-matte-border bg-matte-bg p-3.5 select-none">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all',
                isActive
                  ? 'bg-matte-elevated text-slate-100 border border-matte-border font-semibold shadow-matte-sm'
                  : 'text-slate-400 hover:bg-matte-surface/80 hover:text-slate-200'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.2 text-[10px] font-bold',
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-matte-subtle text-slate-400 border border-matte-border'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {isAdminUnlocked && (
          <button
            onClick={() => onNavigate('admin')}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all mt-3 border border-indigo-500/30',
              currentView === 'admin'
                ? 'bg-matte-elevated text-indigo-300 font-semibold shadow-matte-sm'
                : 'bg-matte-accent-subtle text-indigo-300 hover:bg-matte-accent-subtle/80'
            )}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Admin Panel</span>
            </div>
            <span className="text-[10px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-200">
              Active
            </span>
          </button>
        )}
      </div>

      {/* Overdue alert in sidebar if any */}
      {overdueCount > 0 && (
        <div className="mt-auto pt-4">
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300 shadow-matte-sm">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              {overdueCount} {overdueCount === 1 ? 'task' : 'tasks'} overdue
            </div>
            <p className="mt-1 text-[11px] text-rose-400/80 leading-relaxed">
              Review on Dashboard to complete or reschedule.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
