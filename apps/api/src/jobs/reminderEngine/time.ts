/**
 * Time helpers for Reminder Engine (calendar math in a configured IANA TZ).
 */
export function calendarDateInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Add whole calendar days in UTC math (good enough for milestone offsets). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function iso(date: Date): string {
  return date.toISOString();
}
