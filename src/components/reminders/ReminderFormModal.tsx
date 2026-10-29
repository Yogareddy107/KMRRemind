import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ReminderFormSchema, ReminderFormData } from '../../types';
import { Reminder } from '../../types/database';
import { POPULAR_TIMEZONES, getUserSystemTimezone } from '../../lib/recurrence';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Bell, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReminderFormData) => Promise<{ success: boolean; error?: string }>;
  initialData?: Reminder | null;
}

export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { profile } = useAuth();
  const defaultTz = profile?.preferred_timezone || getUserSystemTimezone();
  const [pastWarningAcknowledged, setPastWarningAcknowledged] = useState(false);
  const [showPastWarning, setShowPastWarning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate default date and time (15 mins from now in local timezone)
  const getInitialDateTime = () => {
    const now = new Date(Date.now() + 15 * 60 * 1000);
    const zoned = toZonedTime(now, defaultTz);
    return {
      date: format(zoned, 'yyyy-MM-dd'),
      time: format(zoned, 'HH:mm'),
    };
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(ReminderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: getInitialDateTime().date,
      time: getInitialDateTime().time,
      timezone: defaultTz,
      priority: 'medium',
      category: 'General',
      recurrence_rule: 'none',
      recurrence_end_date: '',
      notification_enabled: true,
      alert_interval_minutes: 5,
      max_alert_attempts: 3,
      max_alert_duration_minutes: 60,
    },
  });

  const selectedRule = watch('recurrence_rule');
  const notificationEnabled = watch('notification_enabled');
  const selectedDate = watch('date');

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      const zonedDue = toZonedTime(parseISO(initialData.due_at), initialData.timezone);
      reset({
        title: initialData.title,
        description: initialData.description || '',
        date: format(zonedDue, 'yyyy-MM-dd'),
        time: format(zonedDue, 'HH:mm'),
        timezone: initialData.timezone,
        priority: initialData.priority,
        category: initialData.category,
        recurrence_rule: initialData.recurrence_rule,
        recurrence_end_date: initialData.recurrence_end_at
          ? format(toZonedTime(parseISO(initialData.recurrence_end_at), initialData.timezone), 'yyyy-MM-dd')
          : '',
        notification_enabled: initialData.notification_enabled,
        alert_interval_minutes: initialData.alert_interval_minutes as any,
        max_alert_attempts: initialData.max_alert_attempts,
        max_alert_duration_minutes: initialData.max_alert_duration_minutes,
      });
    } else {
      const init = getInitialDateTime();
      reset({
        title: '',
        description: '',
        date: init.date,
        time: init.time,
        timezone: defaultTz,
        priority: 'medium',
        category: 'General',
        recurrence_rule: 'none',
        recurrence_end_date: '',
        notification_enabled: true,
        alert_interval_minutes: 5,
        max_alert_attempts: 3,
        max_alert_duration_minutes: 60,
      });
    }
    setShowPastWarning(false);
    setPastWarningAcknowledged(false);
    setFormError(null);
  }, [initialData, isOpen, defaultTz, reset]);

  const handleFormSubmit = async (data: ReminderFormData) => {
    setFormError(null);

    // Check if scheduled date/time is in the past
    if (!pastWarningAcknowledged) {
      try {
        const utcDateTime = fromZonedTime(`${data.date}T${data.time}`, data.timezone);
        if (utcDateTime.getTime() < Date.now() - 60000) {
          setShowPastWarning(true);
          return;
        }
      } catch {}
    }

    const res = await onSubmit(data);
    if (!res.success) {
      setFormError(res.error || 'Failed to save reminder');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Reminder' : 'New Reminder'}
      description="Configure task details, local date/time, recurrence, and repeat alert options."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {formError && (
          <div className="p-3 text-xs bg-rose-950/40 text-rose-300 rounded-lg border border-rose-800/60 shadow-matte-sm">
            {formError}
          </div>
        )}

        {showPastWarning && !pastWarningAcknowledged && (
          <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-800/40 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-semibold text-amber-300">
                Scheduled time is in the past
              </h5>
              <p className="text-xs text-amber-400/80">
                This reminder is set for a time that has already passed. It will trigger immediately if saved.
              </p>
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setPastWarningAcknowledged(true);
                    setShowPastWarning(false);
                  }}
                >
                  Schedule Anyway
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const init = getInitialDateTime();
                    setValue('date', init.date);
                    setValue('time', init.time);
                    setShowPastWarning(false);
                  }}
                >
                  Set to 15m from now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label="Task Title *"
          placeholder="e.g. Daily Standup, Review Pull Request, Server Deploy"
          error={errors.title?.message}
          {...register('title')}
          autoFocus
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Description or Notes (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-matte-border bg-matte-input px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-matte-accent transition-all"
            placeholder="Add context, links, or notes..."
            {...register('description')}
          />
        </div>

        {/* Date, Time & Timezone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="date"
            label="Date *"
            icon={<Calendar className="w-3.5 h-3.5" />}
            error={errors.date?.message}
            {...register('date')}
          />
          <Input
            type="time"
            label="Time *"
            icon={<Clock className="w-3.5 h-3.5" />}
            error={errors.time?.message}
            {...register('time')}
          />
          <Select
            label="Time Zone *"
            error={errors.timezone?.message}
            {...register('timezone')}
          >
            {POPULAR_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </div>

        {/* Priority & Category */}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" {...register('priority')}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority (Urgent)</option>
          </Select>

          <Select label="Category" {...register('category')}>
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
            <option value="Learning">Learning</option>
          </Select>
        </div>

        {/* Recurrence Rule */}
        <div className="p-3.5 bg-matte-elevated/40 rounded-xl border border-matte-border space-y-3 shadow-matte-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Recurrence Rule" {...register('recurrence_rule')}>
              <option value="none">One-time (Does not repeat)</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays (Monday–Friday)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly (Preserves month-end)</option>
              <option value="custom">Custom (Every 2 days)</option>
            </Select>

            {selectedRule !== 'none' && (
              <Input
                type="date"
                label="Repeat Until (Optional)"
                helperText="Leave empty to repeat indefinitely"
                {...register('recurrence_end_date')}
              />
            )}
          </div>

          {selectedRule === 'monthly' && (
            <p className="text-[11px] text-slate-400">
              ℹ️ Scheduled on day {selectedDate ? parseInt(selectedDate.split('-')[2]) : 'selected'}. Shorter months automatically clamp to the final day (e.g. Feb 28/29, Apr 30).
            </p>
          )}
        </div>

        {/* Notification & Repeat-Until-Stopped Alert Settings */}
        <div className="p-3.5 bg-matte-accent-subtle/30 rounded-xl border border-indigo-500/20 space-y-3 shadow-matte-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Push Notifications & Repeat Alerts
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register('notification_enabled')}
              />
              <div className="w-8 h-4.5 bg-matte-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-matte-accent"></div>
            </label>
          </div>

          {notificationEnabled && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-matte-border">
              <Select
                label="Repeat Alert Interval"
                error={errors.alert_interval_minutes?.message}
                {...register('alert_interval_minutes')}
              >
                <option value={1}>Every 1 minute</option>
                <option value={5}>Every 5 minutes (Recommended)</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
              </Select>

              <Select
                label="Max Repeat Alerts"
                error={errors.max_alert_attempts?.message}
                {...register('max_alert_attempts')}
              >
                <option value={1}>1 notification (No repeat)</option>
                <option value={2}>Up to 2 alerts</option>
                <option value={3}>Up to 3 alerts (Default)</option>
                <option value={5}>Up to 5 alerts</option>
                <option value={10}>Up to 10 alerts</option>
              </Select>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Repeats notifications at the selected interval until completed, snoozed, or dismissed.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex justify-end gap-2 border-t border-matte-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Reminder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
