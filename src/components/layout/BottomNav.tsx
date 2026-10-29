import React from 'react';
import { NavView } from '../../types';
import { useReminders } from '../../context/ReminderContext';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Calendar,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const { occurrences } = useReminders();
  const pendingCount = occurrences.filter((o) => o.status === 'pending' || o.status === 'alerting' || o.status === 'snoozed').length;

  const items = [
    { id: 'dashboard' as NavView, label: 'Today', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'all' as NavView,
      label: 'Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'upcoming' as NavView, label: 'Upcoming', icon: <Clock className="w-4 h-4" /> },
    { id: 'calendar' as NavView, label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'completed' as NavView, label: 'Done', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'settings' as NavView, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-14 w-full items-center justify-around border-t border-matte-border bg-matte-surface/95 px-2 backdrop-blur-md md:hidden">
      {items.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'relative flex flex-col items-center justify-center p-1 transition-colors focus:outline-none',
              isActive
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            )}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-matte-accent text-[8px] font-bold text-white shadow-matte-sm">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
