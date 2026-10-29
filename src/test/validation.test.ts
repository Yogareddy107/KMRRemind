import { describe, it, expect } from 'vitest';
import { ReminderFormSchema } from '../types';

describe('Validation Schemas', () => {
  it('validates a valid reminder input correctly', () => {
    const validData = {
      title: 'Standup Meeting',
      description: 'Discuss sprint goals',
      date: '2026-04-10',
      time: '10:00',
      timezone: 'Asia/Kolkata',
      priority: 'high',
      category: 'Work',
      recurrence_rule: 'weekdays',
      recurrence_end_date: '',
      notification_enabled: true,
      alert_interval_minutes: 5,
      max_alert_attempts: 3,
      max_alert_duration_minutes: 60,
    };

    const parsed = ReminderFormSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('fails if title is empty', () => {
    const invalidData = {
      title: '',
      date: '2026-04-10',
      time: '10:00',
      timezone: 'Asia/Kolkata',
      alert_interval_minutes: 5,
      max_alert_attempts: 3,
    };

    const parsed = ReminderFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain('title is required');
    }
  });

  it('rejects invalid alert interval minutes', () => {
    const invalidData = {
      title: 'Test Reminder',
      date: '2026-04-10',
      time: '10:00',
      timezone: 'UTC',
      alert_interval_minutes: 7, // Not 1, 5, 10, or 15
      max_alert_attempts: 3,
    };

    const parsed = ReminderFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('rejects max alert attempts out of range [1..10]', () => {
    const tooMany = {
      title: 'Test Reminder',
      date: '2026-04-10',
      time: '10:00',
      timezone: 'UTC',
      alert_interval_minutes: 5,
      max_alert_attempts: 25,
    };

    const parsed = ReminderFormSchema.safeParse(tooMany);
    expect(parsed.success).toBe(false);
  });
});

