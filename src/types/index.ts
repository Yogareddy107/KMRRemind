import { z } from 'zod';
import { Priority, RecurrenceRule } from './database';

export type NavView = 'dashboard' | 'all' | 'upcoming' | 'calendar' | 'completed' | 'settings' | 'admin';

export const ReminderFormSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().or(z.literal('')),
  date: z.string().min(1, 'Due date is required'),
  time: z.string().min(1, 'Due time is required'),
  timezone: z.string().min(1, 'Time zone is required'),
  priority: z.enum(['low', 'medium', 'high'] as const).default('medium'),
  category: z.string().min(1, 'Category is required').default('General'),
  recurrence_rule: z.enum(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'] as const).default('none'),
  recurrence_end_date: z.string().optional().or(z.literal('')),
  notification_enabled: z.boolean().default(true),
  alert_interval_minutes: z.coerce.number().refine(val => [1, 5, 10, 15].includes(val), {
    message: 'Interval must be 1, 5, 10, or 15 minutes'
  }).default(5),
  max_alert_attempts: z.coerce.number().min(1, 'Minimum 1 attempt').max(10, 'Maximum 10 attempts').default(3),
  max_alert_duration_minutes: z.coerce.number().optional().nullable(),
});

export type ReminderFormData = z.infer<typeof ReminderFormSchema>;

export interface FilterOptions {
  search: string;
  category: string;
  priority: Priority | 'all';
  status: 'all' | 'active' | 'completed' | 'paused';
  sortBy: 'due_asc' | 'due_desc' | 'priority' | 'title';
}

