import React from 'react';
import { useReminders } from '../context/ReminderContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { NextReminderWidget } from '../components/dashboard/NextReminderWidget';
import { NotificationStatusWidget } from '../components/dashboard/NotificationStatusWidget';
import { QuickAddInput } from '../components/reminders/QuickAddInput';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { EmptyState } from '../components/common/EmptyState';
import { Reminder, ReminderOccurrence } from '../types/database';
import { isToday, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getUserSystemTimezone } from '../lib/recurrence';
import {
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

interface DashboardPageProps {
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onNavigateToView: (view: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreateModal,
  onEditReminder,
  onNavigateToView,
}) => {
  const { profile } = useAuth();
  const {
    occurrences,
    nextDueOccurrence,
    completeOccurrence,
    reopenOccurrence,
    snoozeOccurrence,
    dismissOccurrence,
    deleteReminder,
    togglePauseReminder,
  } = useReminders();

  const userTimezone = profile?.preferred_timezone || getUserSystemTimezone();
  const now = Date.now();

  // Filter today's occurrences
  const todayOccurrences = occurrences.filter((occ: ReminderOccurrence) => {
    if (occ.status === 'completed' || occ.status === 'dismissed') return false;
    try {
      const zoned = toZonedTime(parseISO(occ.scheduled_at), userTimezone);
      return isToday(zoned);
    } catch {
      return false;
    }
  });

  // Filter overdue occurrences
  const overdueOccurrences = occurrences.filter((occ: ReminderOccurrence) => {
    if (occ.status === 'completed' || occ.status === 'dismissed') return false;
    return new Date(occ.scheduled_at).getTime() < now;
  });

  // Filter upcoming (not today and not overdue)
  const upcomingOccurrences = occurrences.filter((occ: ReminderOccurrence) => {
    if (occ.status === 'completed' || occ.status === 'dismissed') return false;
    const isPast = new Date(occ.scheduled_at).getTime() < now;
    const zoned = toZonedTime(parseISO(occ.scheduled_at), userTimezone);
    return !isPast && !isToday(zoned);
  });

  // Completed count
  const completedCount = occurrences.filter((o: ReminderOccurrence) => o.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Quick Add Bar */}
      <div>
        <QuickAddInput onOpenFullModal={onOpenCreateModal} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Today's Tasks"
          value={todayOccurrences.length}
          icon={<CalendarDays className="w-5 h-5" />}
          color="indigo"
          onClick={() => onNavigateToView('all')}
        />
        <StatCard
          label="Upcoming"
          value={upcomingOccurrences.length}
          icon={<Clock className="w-5 h-5" />}
          color="indigo"
          onClick={() => onNavigateToView('upcoming')}
        />
        <StatCard
          label="Overdue"
          value={overdueOccurrences.length}
          icon={<AlertCircle className="w-5 h-5" />}
          color={overdueOccurrences.length > 0 ? 'rose' : 'indigo'}
          onClick={() => onNavigateToView('all')}
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
          onClick={() => onNavigateToView('completed')}
        />
      </div>

      {/* Next Scheduled Reminder & Notification Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NextReminderWidget
          occurrence={nextDueOccurrence}
          onComplete={completeOccurrence}
          onSnooze={snoozeOccurrence}
        />
        <NotificationStatusWidget />
      </div>

      {/* Overdue Tasks Section (if any) */}
      {overdueOccurrences.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-400" />
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
              Overdue Tasks ({overdueOccurrences.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {overdueOccurrences.map((occ: ReminderOccurrence) => (
              <ReminderCard
                key={occ.id}
                occurrence={occ}
                onComplete={completeOccurrence}
                onReopen={reopenOccurrence}
                onSnooze={snoozeOccurrence}
                onDismiss={dismissOccurrence}
                onEdit={onEditReminder}
                onDelete={deleteReminder}
                onTogglePause={togglePauseReminder}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Scheduled For Today ({todayOccurrences.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateToView('all')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all &rarr;
          </button>
        </div>

        {todayOccurrences.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {todayOccurrences.map((occ: ReminderOccurrence) => (
              <ReminderCard
                key={occ.id}
                occurrence={occ}
                onComplete={completeOccurrence}
                onReopen={reopenOccurrence}
                onSnooze={snoozeOccurrence}
                onDismiss={dismissOccurrence}
                onEdit={onEditReminder}
                onDelete={deleteReminder}
                onTogglePause={togglePauseReminder}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reminders due today"
            description="You are all caught up for today. Create a new reminder or review upcoming tasks."
            actionText="Schedule Reminder"
            onAction={onOpenCreateModal}
          />
        )}
      </section>
    </div>
  );
};
