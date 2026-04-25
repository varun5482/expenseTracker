import { clsx, type ClassValue } from 'clsx';

import type { RecurrenceType } from '@/lib/db-types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getMonthBounds(monthKey?: string) {
  const resolved = monthKey ? `${monthKey}-01` : `${toMonthKey()}-01`;
  const [year, month] = resolved.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { start, end };
}

export function toMonthKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateOnly(dateString: string) {
  return dateString;
}

export function formatPhoneToE164(value: string) {
  const raw = value.replace(/[^\d+]/g, '');
  if (raw.startsWith('+')) return raw;
  if (/^91\d{10}$/.test(raw)) return `+${raw}`;
  if (/^\d{10}$/.test(raw)) return `+91${raw}`;
  return raw;
}

export function startOfMonthFromKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function recurrenceToMonths(recurrence: RecurrenceType) {
  if (recurrence === 'monthly') return 1;
  if (recurrence === 'quarterly') return 3;
  if (recurrence === 'yearly') return 12;
  return 0;
}

export function expandRecurringDates(
  startDateString: string,
  recurrence: RecurrenceType,
  monthStart: Date,
  monthEnd: Date,
  endDateString?: string | null
) {
  const dates: Date[] = [];
  const startDate = new Date(`${startDateString}T00:00:00.000Z`);
  const recurrenceEnd = endDateString ? new Date(`${endDateString}T00:00:00.000Z`) : null;

  let cursor = startDate;

  while (cursor < monthStart) {
    if (recurrence === 'daily') cursor = addDays(cursor, 1);
    else if (recurrence === 'weekly') cursor = addDays(cursor, 7);
    else cursor = addMonths(cursor, recurrenceToMonths(recurrence));

    if (recurrenceEnd && cursor > recurrenceEnd) {
      return dates;
    }
  }

  while (cursor < monthEnd) {
    if (recurrenceEnd && cursor > recurrenceEnd) break;
    if (cursor >= monthStart) dates.push(new Date(cursor));

    if (recurrence === 'daily') cursor = addDays(cursor, 1);
    else if (recurrence === 'weekly') cursor = addDays(cursor, 7);
    else cursor = addMonths(cursor, recurrenceToMonths(recurrence));
  }

  return dates;
}

export function recurrenceLabel(recurrence: RecurrenceType) {
  return recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
}
