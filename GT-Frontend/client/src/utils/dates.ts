/**
 * Date helpers for the search forms.
 * All values use the yyyy-mm-dd format of <input type="date">
 * and the user's local time zone, so "today" matches their calendar.
 */

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Today's date (local time) as yyyy-mm-dd. */
export function getTodayIso(): string {
  return toIsoDate(new Date());
}

/** Adds days to a yyyy-mm-dd date. */
export function addDaysIso(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + days);

  return toIsoDate(date);
}

/** True when the date is before today. Empty values are not past. */
export function isPastDate(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return value < getTodayIso();
}
