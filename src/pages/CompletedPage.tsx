import React from 'react';
import { useReminders } from '../context/ReminderContext';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { EmptyState } from '../components/common/EmptyState';
import { Reminder, ReminderOccurrence } from '../types/database';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface CompletedPageProps {
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
}

export const CompletedPage: React.FC<CompletedPageProps> = ({
  onOpenCreateModal,
  onEditReminder,
}) => {
  const {
    occurrences,
    completeOccurrence,
    reopenOccurrence,
    snoozeOccurrence,
    dismissOccurrence,
    deleteReminder,
    togglePauseReminder,
  } = useReminders();

  const completedList = occurrences
    .filter((o: ReminderOccurrence) => o.status === 'completed')
    .sort((a: ReminderOccurrence, b: ReminderOccurrence) => new Date(b.completed_at || b.scheduled_at).getTime() - new Date(a.completed_at || a.scheduled_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Completed Tasks ({completedList.length})
          </h2>
          <p className="text-xs text-slate-400">
            Archived record of all successfully completed tasks. You can reopen any task at any time.
          </p>
        </div>
      </div>

      {completedList.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {completedList.map((occ: ReminderOccurrence) => (
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
          title="No completed tasks yet"
          description="Tasks you mark as done will appear here in your completion history."
          icon={<RotateCcw className="w-6 h-6 text-slate-400" />}
          actionText="Plan a Reminder"
          onAction={onOpenCreateModal}
        />
      )}
    </div>
  );
};
