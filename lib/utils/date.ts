import {
  format,
  parseISO,
  isToday,
  isThisMonth,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'MMM d');
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateStr(dateStr: string): Date {
  return parseISO(dateStr);
}

export function isDateToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), parseISO(dateStr));
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
}

export function monthYearLabel(year: number, month: number): string {
  return format(new Date(year, month - 1), 'MMMM yyyy');
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  const d = parseISO(date);
  return d >= parseISO(start) && d <= parseISO(end);
}

export function addDaysToStr(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), 'yyyy-MM-dd');
}

export function cycleDayLabel(day: number): string {
  if (day === 1) return 'Day 1';
  return `Day ${day}`;
}
