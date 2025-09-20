/**
 * Utility functions for handling dates with UTC 00:00:00
 * This eliminates timezone issues by always working with UTC dates at midnight
 */

/**
 * Converts a date string (YYYY-MM-DD) to UTC Date at 00:00:00
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in UTC 00:00:00
 */
export function dateStringToUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Converts a UTC Date back to date string (YYYY-MM-DD)
 * @param utcDate - Date object in UTC
 * @returns Date string in YYYY-MM-DD format
 */
export function utcToDateString(utcDate: Date): string {
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date as UTC 00:00:00
 * @returns Date object representing today at UTC 00:00:00
 */
export function getTodayUTC(): Date {
  const today = new Date();
  return new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0, 0
  ));
}

/**
 * Compares two UTC dates (ignoring time)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareUTCDates(date1: Date, date2: Date): number {
  const utc1 = new Date(Date.UTC(
    date1.getUTCFullYear(),
    date1.getUTCMonth(),
    date1.getUTCDate()
  ));
  const utc2 = new Date(Date.UTC(
    date2.getUTCFullYear(),
    date2.getUTCMonth(),
    date2.getUTCDate()
  ));

  if (utc1 < utc2) return -1;
  if (utc1 > utc2) return 1;
  return 0;
}

/**
 * Checks if a date is before today (UTC)
 * @param date - Date to check
 * @returns true if date is before today
 */
export function isBeforeToday(date: Date): boolean {
  const today = getTodayUTC();
  return compareUTCDates(date, today) < 0;
}

/**
 * Checks if a date is today (UTC)
 * @param date - Date to check
 * @returns true if date is today
 */
export function isToday(date: Date): boolean {
  const today = getTodayUTC();
  return compareUTCDates(date, today) === 0;
}

/**
 * Checks if a date is after today (UTC)
 * @param date - Date to check
 * @returns true if date is after today
 */
export function isAfterToday(date: Date): boolean {
  const today = getTodayUTC();
  return compareUTCDates(date, today) > 0;
}