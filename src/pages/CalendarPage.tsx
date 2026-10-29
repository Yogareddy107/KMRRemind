import React, { useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { useAuth } from '../context/AuthContext';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { Reminder, ReminderOccurrence } from '../types/database';
import { getUserSystemTimezone } from '../lib/recurrence';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

interface CalendarPageProps {
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map occurrences by date string (yyyy-MM-dd) in user's timezone
  const occurrencesByDate = React.useMemo(() => {
    const map = new Map<string, ReminderOccurrence[]>();
    occurrences.forEach((occ: ReminderOccurrence) => {
      try {
        const zoned = toZonedTime(parseISO(occ.scheduled_at), userTimezone);
        const dateKey = format(zoned, 'yyyy-MM-dd');
        const list = map.get(dateKey) || [];
        list.push(occ);
        map.set(dateKey, list);
      } catch {}
    });
    return map;
  }, [occurrences, userTimezone]);

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedOccurrences = occurrencesByDate.get(selectedDateKey) || [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Calendar View</h2>
          <p className="text-xs text-slate-400">
            Inspect scheduled tasks by calendar date. Click any date to view and manage its reminders.
          </p>
        </div>
        <Button size="sm" onClick={onOpenCreateModal}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Schedule Task
        </Button>
      </div>

      {/* Month Navigation & Grid */}
      <div className="rounded-2xl border border-matte-border bg-matte-surface p-4 shadow-matte">
        <div className="flex items-center justify-between pb-3.5 border-b border-matte-border">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded-md text-slate-400 hover:bg-matte-elevated hover:text-slate-200 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
              className="px-2 py-0.5 text-xs font-semibold text-indigo-400 hover:bg-matte-accent-subtle rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded-md text-slate-400 hover:bg-matte-elevated hover:text-slate-200 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[11px] font-semibold text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayOccurrences = occurrencesByDate.get(dateKey) || [];
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative flex flex-col items-center justify-start rounded-xl p-2 min-h-[56px] transition-all text-xs ${
                  isSelected
                    ? 'bg-matte-accent text-white font-bold shadow-matte-sm border border-indigo-400/20'
                    : isTodayDate
                    ? 'border border-indigo-500/50 bg-matte-accent-subtle/40 font-bold text-indigo-300'
                    : isCurrentMonth
                    ? 'hover:bg-matte-elevated text-slate-300'
                    : 'text-slate-600 hover:bg-matte-elevated/40'
                }`}
              >
                <span>{format(day, 'd')}</span>

                {/* Dot markers */}
                {dayOccurrences.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 flex-wrap justify-center">
                    {dayOccurrences.slice(0, 3).map((occ, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : occ.status === 'completed'
                            ? 'bg-emerald-400'
                            : 'bg-indigo-400'
                        }`}
                      />
                    ))}
                    {dayOccurrences.length > 3 && (
                      <span className={`text-[8px] ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        +{dayOccurrences.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Reminders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-matte-border pb-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Tasks for {format(selectedDate, 'EEEE, MMMM d, yyyy')} ({selectedOccurrences.length})
          </h3>
          <Button size="sm" variant="outline" onClick={onOpenCreateModal}>
            Add Task for this Day
          </Button>
        </div>

        {selectedOccurrences.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedOccurrences.map((occ: ReminderOccurrence) => (
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
          <p className="py-6 text-center text-xs text-slate-500">
            No reminders scheduled for this date.
          </p>
        )}
      </section>
    </div>
  );
};
