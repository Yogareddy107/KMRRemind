import { describe, it, expect } from 'vitest';
import { calculateNextOccurrence, isOccurrenceOverdue } from '../lib/recurrence';
import { formatInTimezone } from '../lib/utils';

describe('Recurrence Engine', () => {
  it('returns null for rule "none"', () => {
    const next = calculateNextOccurrence({
      baseDate: '2026-03-01T10:00:00Z',
      rule: 'none',
    });
    expect(next).toBeNull();
  });

  it('calculates daily recurrence properly', () => {
    const base = new Date('2026-03-01T09:00:00Z');
    const next = calculateNextOccurrence({
      baseDate: base,
      rule: 'daily',
      afterDate: base,
      timezone: 'UTC',
    });
    expect(next).not.toBeNull();
    expect(formatInTimezone(next!.toISOString(), 'UTC', 'yyyy-MM-dd HH:mm')).toBe('2026-03-02 09:00');
  });

  it('calculates weekdays recurrence skipping weekend (Fri -> Mon)', () => {
    // 2026-03-06 is Friday
    const friday = new Date('2026-03-06T10:00:00Z');
    const next = calculateNextOccurrence({
      baseDate: friday,
      rule: 'weekdays',
      afterDate: friday,
      timezone: 'UTC',
    });
    expect(next).not.toBeNull();
    // Next weekday is Monday 2026-03-09
    expect(formatInTimezone(next!.toISOString(), 'UTC', 'yyyy-MM-dd')).toBe('2026-03-09');
  });

  it('calculates weekly recurrence adding 7 days', () => {
    const base = new Date('2026-03-02T14:30:00Z');
    const next = calculateNextOccurrence({
      baseDate: base,
      rule: 'weekly',
      afterDate: base,
      timezone: 'UTC',
    });
    expect(next).not.toBeNull();
    expect(formatInTimezone(next!.toISOString(), 'UTC', 'yyyy-MM-dd HH:mm')).toBe('2026-03-09 14:30');
  });

  it('handles month-end clamping from Jan 31 to Feb 28', () => {
    // 2026 is not a leap year, Feb has 28 days
    const jan31 = new Date('2026-01-31T12:00:00Z');
    const next = calculateNextOccurrence({
      baseDate: jan31,
      rule: 'monthly',
      afterDate: jan31,
      timezone: 'UTC',
    });
    expect(next).not.toBeNull();
    expect(formatInTimezone(next!.toISOString(), 'UTC', 'yyyy-MM-dd')).toBe('2026-02-28');
  });

  it('handles month-end clamping from Mar 31 to Apr 30', () => {
    const mar31 = new Date('2026-03-31T12:00:00Z');
    const next = calculateNextOccurrence({
      baseDate: mar31,
      rule: 'monthly',
      afterDate: mar31,
      timezone: 'UTC',
    });
    expect(next).not.toBeNull();
    expect(formatInTimezone(next!.toISOString(), 'UTC', 'yyyy-MM-dd')).toBe('2026-04-30');
  });

  it('respects recurrence_end_at cutoff and returns null if exceeded', () => {
    const base = new Date('2026-03-01T10:00:00Z');
    const next = calculateNextOccurrence({
      baseDate: base,
      rule: 'daily',
      afterDate: base,
      recurrenceEndAt: new Date('2026-03-01T12:00:00Z'),
      timezone: 'UTC',
    });
    expect(next).toBeNull();
  });

  it('correctly detects overdue occurrences', () => {
    const pastDate = new Date(Date.now() - 100000);
    const futureDate = new Date(Date.now() + 100000);

    expect(isOccurrenceOverdue(pastDate)).toBe(true);
    expect(isOccurrenceOverdue(futureDate)).toBe(false);
  });
});
