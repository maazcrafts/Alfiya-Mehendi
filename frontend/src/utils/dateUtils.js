/**
 * Date utilities for the booking calendar.
 * All functions use Asia/Kolkata (IST) timezone for consistent date handling.
 */

/**
 * Get today's date in YYYY-MM-DD format using Asia/Kolkata timezone.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
export function getISTToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Get current IST date and time parts.
 * @returns {{date: string, time: string}} Date in YYYY-MM-DD and time in HH:MM (24h) format.
 */
export function getISTNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

/**
 * Convert a YYYY-MM-DD date string to a sortable number for comparisons.
 * @param {string} value - Date string in YYYY-MM-DD format.
 * @returns {number} Sortable integer (YYYYMMDD) or 0 if invalid.
 */
export function dateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 0;
  const [y, m, d] = value.split('-').map(Number);
  return y * 10000 + m * 100 + d;
}

/**
 * Check if a date/time combination is in the future (IST).
 * @param {string} dateValue - Date in YYYY-MM-DD format.
 * @param {string} timeValue - Time in HH:MM format (24h).
 * @returns {boolean} True if the appointment is in the future.
 */
export function isFutureAppointment(dateValue, timeValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || '') || !/^\d{2}:\d{2}$/.test(timeValue || '')) {
    return false;
  }
  const now = getISTNowParts();
  if (dateValue > now.date) return true;
  if (dateValue < now.date) return false;
  return timeValue > now.time;
}

/**
 * Add days to a date string without timezone shifts.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @param {number} days - Number of days to add (can be negative).
 * @returns {string} New date in YYYY-MM-DD format.
 */
export function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date at noon to avoid DST edge cases
  const date = new Date(year, month - 1, day + days, 12, 0, 0);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the start of the week (Sunday) for a given date.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} Start of week (Sunday) in YYYY-MM-DD format.
 */
export function startOfWeek(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const diff = date.getDate() - dayOfWeek;
  const start = new Date(date.setDate(diff));
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get an array of 7 consecutive dates starting from a given date.
 * @param {string} startDateStr - Start date in YYYY-MM-DD format.
 * @returns {string[]} Array of 7 dates in YYYY-MM-DD format.
 */
export function getWeekDates(startDateStr) {
  return Array.from({ length: 7 }, (_, i) => addDays(startDateStr, i));
}

/**
 * Check if two date strings represent the same calendar day.
 * @param {string} dateA - Date in YYYY-MM-DD format.
 * @param {string} dateB - Date in YYYY-MM-DD format.
 * @returns {boolean} True if same day.
 */
export function isSameDate(dateA, dateB) {
  return dateA === dateB;
}

/**
 * Check if dateA is before dateB (calendar date comparison).
 * @param {string} dateA - Date in YYYY-MM-DD format.
 * @param {string} dateB - Date in YYYY-MM-DD format.
 * @returns {boolean} True if dateA is before dateB.
 */
export function isBeforeDate(dateA, dateB) {
  return dateKey(dateA) < dateKey(dateB);
}

/**
 * Check if a date is in the past relative to today (IST).
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {boolean} True if date is before today.
 */
export function isPastDate(dateStr) {
  const today = getISTToday();
  return isBeforeDate(dateStr, today);
}

/**
 * Format a date string for display (e.g., "Monday, 15 January 2025").
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} Formatted date string.
 */
export function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  // Use T00:00:00 to avoid timezone parsing issues
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateStr}T00:00:00`));
}

/**
 * Format a time string for display (e.g., "10:30 AM").
 * @param {string} timeStr - Time in HH:MM format (24h).
 * @returns {string} Formatted time string in 12h format with AM/PM.
 */
export function formatTimeLabel(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/**
 * Generate the standard booking time slots (10:00 AM - 8:30 PM, 30-min intervals).
 * @returns {{value: string, label: string}[]} Array of slot objects with 24h value and 12h label.
 */
export function generateBookingSlots() {
  return Array.from({ length: 21 }, (_, i) => {
    const minutes = 600 + i * 30;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return {
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      label: `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`,
    };
  });
}

/**
 * Get the month label for a week (e.g., "January 2025").
 * @param {string} dateStr - Any date in the week (YYYY-MM-DD).
 * @returns {string} Month and year label.
 */
export function getMonthLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, day)
  );
}

/**
 * Get the weekday short label for a date (e.g., "Mon").
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} Weekday short label.
 */
export function getWeekdayShort(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
    new Date(year, month - 1, day)
  );
}

/**
 * Get the weekday narrow label for a date (e.g., "M").
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} Weekday narrow label.
 */
export function getWeekdayNarrow(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(
    new Date(year, month - 1, day)
  );
}

/**
 * Get the day number for a date.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {number} Day of month.
 */
export function getDayNumber(dateStr) {
  const [, , day] = dateStr.split('-').map(Number);
  return day;
}

/**
 * Check if a date is today (IST).
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {boolean} True if date is today.
 */
export function isToday(dateStr) {
  return dateStr === getISTToday();
}