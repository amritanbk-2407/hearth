import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  parseISO,
} from 'date-fns';
import type { BillRecurrence, ChoreRecurrence } from '../types';

/** Today's date as YYYY-MM-DD in the user's local time zone. */
export const todayISO = (now: Date = new Date()) => format(now, 'yyyy-MM-dd');

export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd');

export const shiftDays = (iso: string, days: number) => toISODate(addDays(parseISO(iso), days));

/** Whole days from `from` until `iso` (negative = in the past). */
export const daysUntil = (iso: string, from: string = todayISO()) =>
  differenceInCalendarDays(parseISO(iso), parseISO(from));

/** The next occurrence of a recurring item after `iso`. */
export function nextOccurrence(iso: string, recurrence: ChoreRecurrence | BillRecurrence): string {
  const d = parseISO(iso);
  switch (recurrence) {
    case 'daily':
      return toISODate(addDays(d, 1));
    case 'weekly':
      return toISODate(addWeeks(d, 1));
    case 'monthly':
      return toISODate(addMonths(d, 1));
    case 'quarterly':
      return toISODate(addMonths(d, 3));
    case 'yearly':
      return toISODate(addYears(d, 1));
    default:
      return iso;
  }
}

/** Human label like "Today", "Tomorrow", "In 5 days", "2 days overdue". */
export function relativeDue(iso: string, from: string = todayISO()): string {
  const n = daysUntil(iso, from);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n > 1) return n <= 45 ? `In ${n} days` : format(parseISO(iso), 'd MMM yyyy');
  return `${Math.abs(n)} days overdue`;
}

/** "Last serviced 2 months ago" style label. */
export function relativePast(iso: string, from: string = todayISO()): string {
  const n = -daysUntil(iso, from);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 30) return `${n} days ago`;
  const months = Math.round(n / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.round(n / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export const prettyDate = (iso: string) => format(parseISO(iso), 'd MMM yyyy');
export const shortDate = (iso: string) => format(parseISO(iso), 'd MMM');
export const monthKey = (iso: string) => iso.slice(0, 7);
