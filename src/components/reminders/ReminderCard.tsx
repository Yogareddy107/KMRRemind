import React, { useState } from 'react';
import { ReminderOccurrence, Reminder } from '../../types/database';
import { formatInTimezone, getPriorityBadge, getRecurrenceLabel, cn } from '../../lib/utils';
import { SnoozeModal } from './SnoozeModal';
import {
  Check,
  Clock,
  RotateCcw,
  BellOff,
  MoreVertical,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ReminderCardProps {
  occurrence: ReminderOccurrence;
  onComplete: (occurrenceId: string) => Promise<any>;
  onReopen: (occurrenceId: string) => Promise<any>;
  onSnooze: (occurrenceId: string, minutes: number) => Promise<any>;
  onDismiss: (occurrenceId: string) => Promise<any>;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminderId: string) => Promise<any>;
  onTogglePause?: (reminderId: string) => Promise<any>;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  occurrence,
  onComplete,
  onReopen,
  onSnooze,
  onDismiss,
  onEdit,
  onDelete,
  onTogglePause,
}) => {
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reminder = occurrence.reminder;
  const isCompleted = occurrence.status === 'completed';
  const isSnoozed = occurrence.status === 'snoozed';
  const isDismissed = occurrence.status === 'dismissed';
  const isAlerting = occurrence.status === 'alerting';
  const isPaused = reminder?.status === 'paused';

  const priorityStyle = getPriorityBadge(reminder?.priority || 'medium');
  const userTimezone = reminder?.timezone || 'UTC';

  const isOverdue =
    !isCompleted &&
    !isDismissed &&
    new Date(occurrence.scheduled_at).getTime() < Date.now();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${reminder?.title || 'this reminder'}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(occurrence.reminder_id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 shadow-matte-sm',
          isCompleted
            ? 'border-matte-border bg-matte-surface/40 opacity-70'
            : isAlerting
            ? 'border-indigo-500/50 ring-1 ring-indigo-500/30 bg-matte-surface'
            : isOverdue
            ? 'border-rose-900/60 bg-matte-surface hover:border-rose-800/80'
            : 'border-matte-border bg-matte-surface hover:border-matte-border-focus hover:bg-matte-elevated'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Complete / Checkbox Button */}
          <button
            onClick={() => (isCompleted ? onReopen(occurrence.id) : onComplete(occurrence.id))}
            className={cn(
              'mt-0.5 flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border transition-all focus:outline-none focus:ring-1 focus:ring-matte-accent',
              isCompleted
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-matte-sm'
                : 'border-matte-border bg-matte-input hover:border-indigo-400'
            )}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
          </button>

          {/* Title & Notes */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
                className={cn(
                  'text-xs font-semibold text-slate-100 break-words tracking-tight',
                  isCompleted && 'line-through text-slate-500'
                )}
              >
                {reminder?.title || 'Untitled Reminder'}
              </h4>

              {/* Priority Tag */}
              <span className={cn('px-1.5 py-0.2 rounded text-[9px] font-medium', priorityStyle.className)}>
                {priorityStyle.label}
              </span>

              {/* Category Tag */}
              {reminder?.category && (
                <span className="px-1.5 py-0.2 rounded bg-matte-subtle text-slate-400 border border-matte-border text-[9px] font-medium">
                  {reminder.category}
                </span>
              )}

              {/* Recurrence Rule Tag */}
              {reminder && reminder.recurrence_rule !== 'none' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-indigo-300 bg-matte-accent-subtle px-1.5 py-0.2 rounded border border-indigo-500/20">
                  <RotateCcw className="w-2.5 h-2.5" />
                  {getRecurrenceLabel(reminder.recurrence_rule)}
                </span>
              )}
            </div>

            {reminder?.description && (
              <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {reminder.description}
              </p>
            )}

            {/* Scheduling Info */}
            <div className="mt-2 flex items-center gap-2.5 text-[11px] text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                {formatInTimezone(occurrence.scheduled_at, userTimezone, 'EEE, MMM d · h:mm a')}
              </span>

              {/* Overdue Warning */}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}

              {/* Snoozed State Info */}
              {isSnoozed && occurrence.snooze_until && (
                <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                  <Clock className="w-3 h-3" />
                  Snoozed until {formatInTimezone(occurrence.snooze_until, userTimezone, 'h:mm a')}
                </span>
              )}

              {/* Paused series badge */}
              {isPaused && (
                <span className="text-amber-400 font-medium text-[10px]">
                  (Series Paused)
                </span>
              )}
            </div>
          </div>

          {/* Action Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-matte-elevated transition-colors"
              aria-label="More actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-matte-border bg-matte-elevated p-1 shadow-matte-lg animate-in fade-in duration-100"
                onClick={() => setShowMenu(false)}
              >
                {reminder && (
                  <button
                    onClick={() => onEdit(reminder)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-matte-subtle hover:text-white"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    Edit Reminder
                  </button>
                )}

                {reminder && reminder.recurrence_rule !== 'none' && onTogglePause && (
                  <button
                    onClick={() => onTogglePause(reminder.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-matte-subtle"
                  >
                    {isPaused ? (
                      <>
                        <PlayCircle className="w-3 h-3 text-emerald-400" />
                        Resume Series
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3 h-3 text-amber-400" />
                        Pause Series
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Footer Action Bar for Due/Alerting/Pending tasks */}
        {!isCompleted && (
          <div className="mt-3 pt-2.5 border-t border-matte-border flex items-center justify-end gap-1.5">
            <button
              onClick={() => setShowSnoozeModal(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-matte-subtle transition-colors"
            >
              <Clock className="w-3 h-3 text-indigo-400" />
              Snooze
            </button>

            {isAlerting && (
              <button
                onClick={() => onDismiss(occurrence.id)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-matte-subtle transition-colors"
              >
                <BellOff className="w-3 h-3 text-slate-400" />
                Dismiss
              </button>
            )}

            <button
              onClick={() => onComplete(occurrence.id)}
              className="inline-flex items-center gap-1 rounded-md bg-matte-accent-subtle px-2.5 py-1 text-[11px] font-medium text-indigo-300 border border-indigo-500/20 hover:bg-matte-accent-subtle/80 transition-colors"
            >
              <Check className="w-3 h-3" />
              Done
            </button>
          </div>
        )}
      </div>

      {showSnoozeModal && (
        <SnoozeModal
          isOpen={showSnoozeModal}
          onClose={() => setShowSnoozeModal(false)}
          onSnooze={(minutes) => onSnooze(occurrence.id, minutes)}
          title={`Snooze "${reminder?.title}"`}
        />
      )}
    </>
  );
};
