import React from 'react';
import { ReminderOccurrence } from '../../types/database';
import { formatInTimezone, getPriorityBadge } from '../../lib/utils';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface NextReminderWidgetProps {
  occurrence: ReminderOccurrence | null;
  onComplete?: (id: string) => void;
  onSnooze?: (id: string, mins: number) => void;
}

export const NextReminderWidget: React.FC<NextReminderWidgetProps> = ({
  occurrence,
  onComplete,
  onSnooze,
}) => {
  if (!occurrence) {
    return (
      <div className="rounded-xl border border-matte-border bg-matte-surface p-5 shadow-matte-sm">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Next Scheduled Reminder
        </div>
        <div className="mt-4 flex items-center gap-3 text-slate-400">
          <div className="h-8 w-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">All caught up</p>
            <p className="text-[11px] text-slate-500">No pending reminders due right now.</p>
          </div>
        </div>
      </div>
    );
  }

  const reminder = occurrence.reminder;
  const userTimezone = reminder?.timezone || 'UTC';
  const priorityStyle = getPriorityBadge(reminder?.priority || 'medium');

  return (
    <div className="rounded-xl border border-matte-border bg-gradient-to-b from-matte-surface to-matte-elevated/50 p-5 shadow-matte">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Next Scheduled Reminder
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${priorityStyle.className}`}>
          {priorityStyle.label} Priority
        </span>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-bold tracking-tight text-slate-100">
          {reminder?.title || 'Scheduled Task'}
        </h4>
        {reminder?.description && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {reminder.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-matte-border">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          {formatInTimezone(occurrence.next_alert_at, userTimezone, 'EEE, MMM d · h:mm a')}
        </div>

        <div className="flex items-center gap-2">
          {onSnooze && (
            <Button size="sm" variant="outline" onClick={() => onSnooze(occurrence.id, 10)}>
              Snooze 10m
            </Button>
          )}
          {onComplete && (
            <Button size="sm" variant="primary" onClick={() => onComplete(occurrence.id)}>
              Mark Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
