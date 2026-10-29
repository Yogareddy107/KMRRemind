import React, { useState } from 'react';
import { Button } from '../common/Button';
import { useReminders } from '../../context/ReminderContext';
import { useAuth } from '../../context/AuthContext';
import { getUserSystemTimezone } from '../../lib/recurrence';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Plus, Clock } from 'lucide-react';

export const QuickAddInput: React.FC<{ onOpenFullModal?: () => void }> = ({ onOpenFullModal }) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { createReminder } = useReminders();
  const { profile } = useAuth();

  const userTimezone = profile?.preferred_timezone || getUserSystemTimezone();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      // Default to 1 hour from now
      const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
      const zoned = toZonedTime(defaultTime, userTimezone);

      await createReminder({
        title: title.trim(),
        description: '',
        date: format(zoned, 'yyyy-MM-dd'),
        time: format(zoned, 'HH:mm'),
        timezone: userTimezone,
        priority: 'medium',
        category: 'General',
        recurrence_rule: 'none',
        notification_enabled: true,
        alert_interval_minutes: 5,
        max_alert_attempts: 3,
      });

      setTitle('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-xl border border-matte-border bg-matte-surface p-1.5 shadow-matte-sm transition-all focus-within:border-matte-border-focus focus-within:ring-1 focus-within:ring-matte-accent"
    >
      <input
        type="text"
        placeholder="Quick add reminder (e.g. Code review at 4 PM)..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
      />

      {onOpenFullModal && (
        <button
          type="button"
          onClick={onOpenFullModal}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-matte-elevated hover:text-slate-200 transition-colors"
          title="More scheduling options"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      )}

      <Button type="submit" size="sm" loading={loading} disabled={!title.trim()}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add
      </Button>
    </form>
  );
};
