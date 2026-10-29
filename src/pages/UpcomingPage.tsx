import React from 'react';
import { useReminders } from '../context/ReminderContext';
import { useAuth } from '../context/AuthContext';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { EmptyState } from '../components/common/EmptyState';
import { Reminder, ReminderOccurrence } from '../types/database';
import { parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getUserSystemTimezone } from '../lib/recurrence';
import { Clock, Calendar } from 'lucide-react';

interface UpcomingPageProps {
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
}

export const UpcomingPage: React.FC<UpcomingPageProps> = ({
  onOpenCreateModal,
  onEditReminder,
}) => {
  const { profile } = useAuth();
  const {
    occurrences,
    completeOccurrence,
    reopenOccurrence,
    snoozeOccurrence,
    dismissOccurrence,
    deleteReminder,
    togglePauseReminder,
  } = useReminders();

  const userTimezone = profile?.preferred_timezone || getUserSystemTimezone();

  // Active upcoming occurrences
  const upcomingList = occurrences
    .filter((o: ReminderOccurrence) => o.status === 'pending' || o.status === 'alerting' || o.status === 'snoozed')
    .sort((a: ReminderOccurrence, b: ReminderOccurrence) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Grouping
  const todayList = upcomingList.filter((o: ReminderOccurrence) => {
    try {
      return isToday(toZonedTime(parseISO(o.scheduled_at), userTimezone));
    } catch {
      return false;
    }
  });

  const tomorrowList = upcomingList.filter((o: ReminderOccurrence) => {
    try {
      return isTomorrow(toZonedTime(parseISO(o.scheduled_at), userTimezone));
    } catch {
      return false;
    }
  });

  const thisWeekList = upcomingList.filter((o: ReminderOccurrence) => {
    try {
      const zoned = toZonedTime(parseISO(o.scheduled_at), userTimezone);
      return !isToday(zoned) && !isTomorrow(zoned) && isThisWeek(zoned);
    } catch {
      return false;
    }
  });

  const futureList = upcomingList.filter((o: ReminderOccurrence) => {
    try {
      const zoned = toZonedTime(parseISO(o.scheduled_at), userTimezone);
      return !isToday(zoned) && !isTomorrow(zoned) && !isThisWeek(zoned);
    } catch {
      return false;
    }
  });

  const renderSection = (title: string, list: typeof upcomingList, icon: React.ReactNode) => {
    if (list.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-matte-border pb-2">
          {icon}
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {title} ({list.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((occ: ReminderOccurrence) => (
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
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Upcoming Reminders</h2>
        <p className="text-xs text-slate-400">
          Chronological timeline of scheduled tasks and repeat alerts across days and weeks.
        </p>
      </div>

      {upcomingList.length > 0 ? (
        <div className="space-y-8">
          {renderSection('Today', todayList, <Clock className="w-4 h-4 text-indigo-400" />)}
          {renderSection('Tomorrow', tomorrowList, <Calendar className="w-4 h-4 text-emerald-400" />)}
          {renderSection('Later This Week', thisWeekList, <Calendar className="w-4 h-4 text-amber-400" />)}
          {renderSection('Future Dates', futureList, <Calendar className="w-4 h-4 text-slate-500" />)}
        </div>
      ) : (
        <EmptyState
          title="No upcoming reminders"
          description="Your schedule is completely clear! Click below to plan a task or recurring reminder."
          actionText="Create Reminder"
          onAction={onOpenCreateModal}
        />
      )}
    </div>
  );
};
