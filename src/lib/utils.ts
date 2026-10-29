import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Priority, RecurrenceRule, ReminderStatus } from '../types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a UTC ISO date string into readable local representation using the given IANA timezone
 */
export function formatInTimezone(
  isoDateString: string | null | undefined,
  tz: string = 'UTC',
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  if (!isoDateString) return '—';
  try {
    const parsed = parseISO(isoDateString);
    if (!isValid(parsed)) return '—';
    const zoned = toZonedTime(parsed, tz);
    return format(zoned, formatStr);
  } catch {
    return '—';
  }
}

/**
 * Priority badge styling - Matte Pro
 */
export function getPriorityBadge(priority: Priority): { label: string; className: string } {
  switch (priority) {
    case 'high':
      return {
        label: 'High',
        className: 'bg-rose-950/40 text-rose-300 border border-rose-800/50 shadow-matte-sm',
      };
    case 'medium':
      return {
        label: 'Medium',
        className: 'bg-amber-950/40 text-amber-300 border border-amber-800/50 shadow-matte-sm',
      };
    case 'low':
      return {
        label: 'Low',
        className: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 shadow-matte-sm',
      };
    default:
      return {
        label: 'Normal',
        className: 'bg-matte-subtle text-slate-300 border border-matte-border shadow-matte-sm',
      };
  }
}

/**
 * Human-readable recurrence label
 */
export function getRecurrenceLabel(rule: RecurrenceRule): string {
  switch (rule) {
    case 'none':
      return 'Does not repeat';
    case 'daily':
      return 'Repeats Daily';
    case 'weekdays':
      return 'Every Weekday (Mon–Fri)';
    case 'weekly':
      return 'Repeats Weekly';
    case 'monthly':
      return 'Repeats Monthly';
    case 'custom':
      return 'Custom Interval';
    default:
      return 'One-time';
  }
}

/**
 * Status badge styling - Matte Pro
 */
export function getStatusBadge(status: ReminderStatus): { label: string; className: string } {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        className: 'bg-matte-accent-subtle text-indigo-300 border border-indigo-500/30 shadow-matte-sm',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 shadow-matte-sm',
      };
    case 'paused':
      return {
        label: 'Paused',
        className: 'bg-matte-subtle text-slate-400 border border-matte-border',
      };
    case 'archived':
      return {
        label: 'Archived',
        className: 'bg-zinc-900/60 text-zinc-400 border border-zinc-800',
      };
  }
}
