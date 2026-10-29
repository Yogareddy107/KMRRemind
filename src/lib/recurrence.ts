import {
  addDays,
  addWeeks,
  addMonths,
  isWeekend,
  lastDayOfMonth,
  setDate,
  isBefore,
  parseISO,
  isValid
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { RecurrenceRule } from '../types/database';

/**
 * Calculates the next occurrence date for a reminder given:
 * - baseDate (UTC Date or ISO string)
 * - rule (RecurrenceRule)
 * - timezone (IANA string, e.g. 'Asia/Kolkata', 'America/New_York', 'UTC')
 * - afterDate (UTC Date or ISO string after which the next occurrence must fall, defaults to now)
 * - recurrenceEndAt (optional cutoff)
 *
 * DST-Safe: Computes in local wall-clock calendar time, then converts back to UTC.
 */
export function calculateNextOccurrence({
  baseDate,
  rule,
  timezone = 'UTC',
  afterDate = new Date(),
  recurrenceEndAt,
}: {
  baseDate: Date | string;
  rule: RecurrenceRule;
  timezone?: string;
  afterDate?: Date | string;
  recurrenceEndAt?: Date | string | null;
}): Date | null {
  if (rule === 'none') {
    return null;
  }

  const baseUtc = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
  const afterUtc = typeof afterDate === 'string' ? parseISO(afterDate) : afterDate;

  if (!isValid(baseUtc) || !isValid(afterUtc)) {
    return null;
  }

  // Convert to local zoned representation so wall-clock time (e.g. 09:30 AM) stays identical
  let currentZoned = toZonedTime(baseUtc, timezone);
  const afterZoned = toZonedTime(afterUtc, timezone);

  // Original target day-of-month (e.g. 31 for monthly reminders)
  const targetDayOfMonth = currentZoned.getDate();

  let iterations = 0;
  const MAX_ITERATIONS = 1000;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    switch (rule) {
      case 'daily': {
        currentZoned = addDays(currentZoned, 1);
        break;
      }

      case 'weekdays': {
        do {
          currentZoned = addDays(currentZoned, 1);
        } while (isWeekend(currentZoned));
        break;
      }

      case 'weekly': {
        currentZoned = addWeeks(currentZoned, 1);
        break;
      }

      case 'monthly': {
        // Advance month
        const nextMonthDate = addMonths(currentZoned, 1);
        // Find max days in that target month
        const maxDaysInNextMonth = lastDayOfMonth(nextMonthDate).getDate();
        // Clamping policy: if scheduled for 31st, clamp to 30th (or 28th/29th in Feb)
        const clampedDay = Math.min(targetDayOfMonth, maxDaysInNextMonth);
        currentZoned = setDate(nextMonthDate, clampedDay);
        break;
      }

      case 'custom': {
        // Default custom to 2 days or as configured
        currentZoned = addDays(currentZoned, 2);
        break;
      }

      default:
        return null;
    }

    // Convert candidate back to UTC to compare timestamps
    const candidateUtc = fromZonedTime(currentZoned, timezone);

    // Check if candidate is strictly after afterUtc
    if (isBefore(afterUtc, candidateUtc)) {
      // Check if candidate exceeds recurrenceEndAt
      if (recurrenceEndAt) {
        const endUtc = typeof recurrenceEndAt === 'string' ? parseISO(recurrenceEndAt) : recurrenceEndAt;
        if (isValid(endUtc) && isBefore(endUtc, candidateUtc)) {
          return null; // Expired past end date
        }
      }
      return candidateUtc;
    }
  }

  return null;
}

/**
 * Checks whether an occurrence is currently overdue
 */
export function isOccurrenceOverdue(scheduledAt: Date | string, timezone = 'UTC'): boolean {
  const schedUtc = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  const nowUtc = new Date();
  return isBefore(schedUtc, nowUtc);
}

/**
 * Common IANA Timezones list for user selector
 */
export const POPULAR_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

/**
 * Detect user's system IANA timezone safely
 */
export function getUserSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

