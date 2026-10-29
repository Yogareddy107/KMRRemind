import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Reminder, ReminderOccurrence, OccurrenceStatus, ReminderStatus } from '../types/database';
import { ReminderFormData } from '../types';
import { calculateNextOccurrence } from '../lib/recurrence';
import { audioManager } from '../lib/audio';
import { fromZonedTime } from 'date-fns-tz';

interface ReminderContextType {
  reminders: Reminder[];
  occurrences: ReminderOccurrence[];
  loading: boolean;
  createReminder: (data: ReminderFormData) => Promise<{ success: boolean; error?: string }>;
  updateReminder: (id: string, data: ReminderFormData) => Promise<{ success: boolean; error?: string }>;
  deleteReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  togglePauseReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  completeOccurrence: (occurrenceId: string) => Promise<{ success: boolean; error?: string }>;
  reopenOccurrence: (occurrenceId: string) => Promise<{ success: boolean; error?: string }>;
  snoozeOccurrence: (occurrenceId: string, minutes: number) => Promise<{ success: boolean; error?: string }>;
  dismissOccurrence: (occurrenceId: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  nextDueOccurrence: ReminderOccurrence | null;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [occurrences, setOccurrences] = useState<ReminderOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper for localStorage fallback
  const getLocalCacheKey = (type: string) => `kmr_${user?.id || 'demo'}_${type}`;

  const loadLocalData = useCallback(() => {
    try {
      const localReminders = localStorage.getItem(getLocalCacheKey('reminders'));
      const localOccurrences = localStorage.getItem(getLocalCacheKey('occurrences'));
      if (localReminders) setReminders(JSON.parse(localReminders));
      if (localOccurrences) setOccurrences(JSON.parse(localOccurrences));
    } catch (e) {
      console.warn('Local cache read error:', e);
    }
  }, [user]);

  const saveLocalData = (newReminders: Reminder[], newOccurrences: ReminderOccurrence[]) => {
    try {
      localStorage.setItem(getLocalCacheKey('reminders'), JSON.stringify(newReminders));
      localStorage.setItem(getLocalCacheKey('occurrences'), JSON.stringify(newOccurrences));
    } catch (e) {
      console.warn('Local cache write error:', e);
    }
  };

  const refreshData = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setOccurrences([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch reminders
      const { data: remData, error: remError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_at', { ascending: true });

      if (remError) {
        console.warn('Supabase reminders fetch note (using local cache):', remError.message);
        loadLocalData();
        return;
      }

      // Fetch occurrences
      const { data: occData, error: occError } = await supabase
        .from('reminder_occurrences')
        .select('*, reminder:reminders(*)')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (occError) {
        console.warn('Supabase occurrences fetch note:', occError.message);
        loadLocalData();
        return;
      }

      const fetchedReminders = (remData || []) as Reminder[];
      const fetchedOccurrences = (occData || []) as ReminderOccurrence[];

      setReminders(fetchedReminders);
      setOccurrences(fetchedOccurrences);
      saveLocalData(fetchedReminders, fetchedOccurrences);
    } catch (e) {
      console.warn('Network fetch error, fallback to local cache:', e);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  }, [user, loadLocalData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Periodic client-side check for due reminders & sound chimes
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      occurrences.forEach((occ) => {
        if (
          occ.status === 'pending' ||
          occ.status === 'alerting' ||
          (occ.status === 'snoozed' && occ.snooze_until && new Date(occ.snooze_until) <= now)
        ) {
          const nextAlert = new Date(occ.next_alert_at);
          if (nextAlert <= now) {
            audioManager.playChime();
          }
        }
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [occurrences]);

  // Calculate Next Due Occurrence
  const nextDueOccurrence = React.useMemo(() => {
    const active = occurrences
      .filter((o) => o.status === 'pending' || o.status === 'alerting' || o.status === 'snoozed')
      .sort((a, b) => new Date(a.next_alert_at).getTime() - new Date(b.next_alert_at).getTime());
    return active[0] || null;
  }, [occurrences]);

  // Create Reminder
  const createReminder = async (formData: ReminderFormData): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    try {
      // Compute UTC timestamp from local date, time, and timezone
      const localDateTimeString = `${formData.date}T${formData.time}`;
      const dueAtUtc = fromZonedTime(localDateTimeString, formData.timezone).toISOString();

      let recurrenceEndAtUtc: string | null = null;
      if (formData.recurrence_end_date) {
        recurrenceEndAtUtc = fromZonedTime(`${formData.recurrence_end_date}T23:59:59`, formData.timezone).toISOString();
      }

      const newReminderId = crypto.randomUUID();
      const newOccurrenceId = crypto.randomUUID();

      const newReminder: Reminder = {
        id: newReminderId,
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        priority: formData.priority,
        category: formData.category || 'General',
        timezone: formData.timezone,
        due_at: dueAtUtc,
        recurrence_rule: formData.recurrence_rule,
        recurrence_end_at: recurrenceEndAtUtc,
        notification_enabled: formData.notification_enabled,
        alert_interval_minutes: formData.alert_interval_minutes,
        max_alert_attempts: formData.max_alert_attempts,
        max_alert_duration_minutes: formData.max_alert_duration_minutes || null,
        status: 'active',
        next_occurrence_at: dueAtUtc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const initialOccurrence: ReminderOccurrence = {
        id: newOccurrenceId,
        reminder_id: newReminderId,
        user_id: user.id,
        scheduled_at: dueAtUtc,
        triggered_at: null,
        completed_at: null,
        dismissed_at: null,
        snooze_until: null,
        next_alert_at: dueAtUtc,
        alert_attempt_count: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reminder: newReminder,
      };

      // Attempt Supabase insert
      const { error: remError } = await supabase.from('reminders').insert(newReminder);
      if (remError) {
        console.warn('Supabase reminder insert warning (saved locally):', remError.message);
      } else {
        await supabase.from('reminder_occurrences').insert({
          id: newOccurrenceId,
          reminder_id: newReminderId,
          user_id: user.id,
          scheduled_at: dueAtUtc,
          next_alert_at: dueAtUtc,
          status: 'pending',
          alert_attempt_count: 0,
        });
      }

      const updatedReminders = [newReminder, ...reminders];
      const updatedOccurrences = [initialOccurrence, ...occurrences];
      setReminders(updatedReminders);
      setOccurrences(updatedOccurrences);
      saveLocalData(updatedReminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create reminder' };
    }
  };

  // Update Reminder
  const updateReminder = async (id: string, formData: ReminderFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const localDateTimeString = `${formData.date}T${formData.time}`;
      const dueAtUtc = fromZonedTime(localDateTimeString, formData.timezone).toISOString();

      let recurrenceEndAtUtc: string | null = null;
      if (formData.recurrence_end_date) {
        recurrenceEndAtUtc = fromZonedTime(`${formData.recurrence_end_date}T23:59:59`, formData.timezone).toISOString();
      }

      const updates: Partial<Reminder> = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        priority: formData.priority,
        category: formData.category,
        timezone: formData.timezone,
        due_at: dueAtUtc,
        recurrence_rule: formData.recurrence_rule,
        recurrence_end_at: recurrenceEndAtUtc,
        notification_enabled: formData.notification_enabled,
        alert_interval_minutes: formData.alert_interval_minutes,
        max_alert_attempts: formData.max_alert_attempts,
        max_alert_duration_minutes: formData.max_alert_duration_minutes || null,
        next_occurrence_at: dueAtUtc,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('reminders').update(updates).eq('id', id);

      // Also update pending occurrence scheduled_at & next_alert_at
      await supabase
        .from('reminder_occurrences')
        .update({
          scheduled_at: dueAtUtc,
          next_alert_at: dueAtUtc,
          updated_at: new Date().toISOString(),
        })
        .eq('reminder_id', id)
        .eq('status', 'pending');

      const updatedReminders = reminders.map((r) => (r.id === id ? { ...r, ...updates } : r));
      const updatedOccurrences = occurrences.map((o) => {
        if (o.reminder_id === id && o.status === 'pending') {
          return {
            ...o,
            scheduled_at: dueAtUtc,
            next_alert_at: dueAtUtc,
            reminder: { ...(o.reminder || ({} as Reminder)), ...updates },
          };
        }
        return o;
      });

      setReminders(updatedReminders);
      setOccurrences(updatedOccurrences);
      saveLocalData(updatedReminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update reminder' };
    }
  };

  // Delete Reminder
  const deleteReminder = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await supabase.from('reminders').delete().eq('id', id);

      const updatedReminders = reminders.filter((r) => r.id !== id);
      const updatedOccurrences = occurrences.filter((o) => o.reminder_id !== id);

      setReminders(updatedReminders);
      setOccurrences(updatedOccurrences);
      saveLocalData(updatedReminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete reminder' };
    }
  };

  // Toggle Pause/Resume Recurring Reminder
  const togglePauseReminder = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const target = reminders.find((r) => r.id === id);
      if (!target) return { success: false, error: 'Reminder not found' };

      const newStatus: ReminderStatus = target.status === 'active' ? 'paused' : 'active';
      await supabase.from('reminders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);

      const updatedReminders = reminders.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
      setReminders(updatedReminders);
      saveLocalData(updatedReminders, occurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Complete Occurrence
  const completeOccurrence = async (occurrenceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const occ = occurrences.find((o) => o.id === occurrenceId);
      if (!occ) return { success: false, error: 'Occurrence not found' };

      const reminder = reminders.find((r) => r.id === occ.reminder_id) || occ.reminder;
      const completedTime = new Date().toISOString();

      // Trigger celebration confetti & success fanfare sound
      audioManager.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}

      // Update current occurrence
      await supabase
        .from('reminder_occurrences')
        .update({
          status: 'completed',
          completed_at: completedTime,
          updated_at: completedTime,
        })
        .eq('id', occurrenceId);

      let nextOcc: ReminderOccurrence | null = null;

      // Handle recurrence: advance to next occurrence if repeating
      if (reminder && reminder.recurrence_rule !== 'none') {
        const nextOccurrenceDate = calculateNextOccurrence({
          baseDate: occ.scheduled_at,
          rule: reminder.recurrence_rule,
          timezone: reminder.timezone,
          afterDate: new Date(),
          recurrenceEndAt: reminder.recurrence_end_at,
        });

        if (nextOccurrenceDate) {
          const nextOccIso = nextOccurrenceDate.toISOString();
          const nextOccId = crypto.randomUUID();

          nextOcc = {
            id: nextOccId,
            reminder_id: reminder.id,
            user_id: occ.user_id,
            scheduled_at: nextOccIso,
            triggered_at: null,
            completed_at: null,
            dismissed_at: null,
            snooze_until: null,
            next_alert_at: nextOccIso,
            alert_attempt_count: 0,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reminder,
          };

          await supabase.from('reminders').update({ next_occurrence_at: nextOccIso }).eq('id', reminder.id);
          await supabase.from('reminder_occurrences').insert({
            id: nextOccId,
            reminder_id: reminder.id,
            user_id: occ.user_id,
            scheduled_at: nextOccIso,
            next_alert_at: nextOccIso,
            status: 'pending',
          });
        }
      } else if (reminder) {
        // One-time reminder completed
        await supabase.from('reminders').update({ status: 'completed' }).eq('id', reminder.id);
      }

      // Update React state
      const updatedOccurrences = occurrences.map((o) =>
        o.id === occurrenceId
          ? { ...o, status: 'completed' as OccurrenceStatus, completed_at: completedTime }
          : o
      );
      if (nextOcc) {
        updatedOccurrences.push(nextOcc);
      }

      const updatedReminders = reminders.map((r) => {
        if (r.id === occ.reminder_id) {
          if (reminder?.recurrence_rule === 'none') {
            return { ...r, status: 'completed' as const };
          }
          if (nextOcc) {
            return { ...r, next_occurrence_at: nextOcc.scheduled_at };
          }
        }
        return r;
      });

      setOccurrences(updatedOccurrences);
      setReminders(updatedReminders);
      saveLocalData(updatedReminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to complete task' };
    }
  };

  // Reopen Occurrence
  const reopenOccurrence = async (occurrenceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const occ = occurrences.find((o) => o.id === occurrenceId);
      if (!occ) return { success: false, error: 'Occurrence not found' };

      await supabase
        .from('reminder_occurrences')
        .update({
          status: 'pending',
          completed_at: null,
          dismissed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', occurrenceId);

      await supabase.from('reminders').update({ status: 'active' }).eq('id', occ.reminder_id);

      const updatedOccurrences = occurrences.map((o) =>
        o.id === occurrenceId ? { ...o, status: 'pending' as const, completed_at: null, dismissed_at: null } : o
      );
      const updatedReminders = reminders.map((r) =>
        r.id === occ.reminder_id ? { ...r, status: 'active' as const } : r
      );

      setOccurrences(updatedOccurrences);
      setReminders(updatedReminders);
      saveLocalData(updatedReminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Snooze Occurrence
  const snoozeOccurrence = async (
    occurrenceId: string,
    minutes: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const snoozeTarget = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      await supabase
        .from('reminder_occurrences')
        .update({
          status: 'snoozed',
          snooze_until: snoozeTarget,
          next_alert_at: snoozeTarget,
          updated_at: new Date().toISOString(),
        })
        .eq('id', occurrenceId);

      const updatedOccurrences = occurrences.map((o) =>
        o.id === occurrenceId
          ? { ...o, status: 'snoozed' as const, snooze_until: snoozeTarget, next_alert_at: snoozeTarget }
          : o
      );

      setOccurrences(updatedOccurrences);
      saveLocalData(reminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Dismiss Occurrence
  const dismissOccurrence = async (occurrenceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const nowIso = new Date().toISOString();

      await supabase
        .from('reminder_occurrences')
        .update({
          status: 'dismissed',
          dismissed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', occurrenceId);

      const updatedOccurrences = occurrences.map((o) =>
        o.id === occurrenceId ? { ...o, status: 'dismissed' as const, dismissed_at: nowIso } : o
      );

      setOccurrences(updatedOccurrences);
      saveLocalData(reminders, updatedOccurrences);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        occurrences,
        loading,
        createReminder,
        updateReminder,
        deleteReminder,
        togglePauseReminder,
        completeOccurrence,
        reopenOccurrence,
        snoozeOccurrence,
        dismissOccurrence,
        refreshData,
        nextDueOccurrence,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};
