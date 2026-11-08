import type { DateRange } from "@/types";


const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = parseISODate(value);
  return !Number.isNaN(date.getTime()) && toISODate(date) === value;
}

export function addDays(iso: string, days: number): string {
  return toISODate(new Date(parseISODate(iso).getTime() + days * DAY_MS));
}

export function diffInDays(startISO: string, endISO: string): number {
  return Math.round((parseISODate(endISO).getTime() - parseISODate(startISO).getTime()) / DAY_MS);
}

export function lastDays(endISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(endISO, index - (count - 1)));
}

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate < b.endDate && b.startDate < a.endDate;
}

export function hasRangeConflict(bookedRanges: DateRange[], candidate: DateRange): boolean {
  return bookedRanges.some((range) => rangesOverlap(range, candidate));
}

export function isDayBooked(bookedRanges: DateRange[], day: string): boolean {
  return bookedRanges.some((range) => day >= range.startDate && day < range.endDate);
}

export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonthYear(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
