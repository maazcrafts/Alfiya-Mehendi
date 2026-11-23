import { useMemo } from 'react';
import {
  getISTToday,
  addDays,
  startOfWeek,
  getWeekDates,
  isSameDate,
  isBeforeDate,
  formatDateLabel,
  getMonthLabel,
  getWeekdayShort,
  getWeekdayNarrow,
  getDayNumber,
  isToday,
} from '../utils/dateUtils.js';
import '../styles/week-strip-calendar.css';

/**
 * WeekStripCalendar — A horizontal weekly date selector.
 *
 * Props:
 *   selectedDate {string} — Date in YYYY-MM-DD format (required).
 *   onSelect {function} — Callback(dateStr) when a day is clicked (required).
 *   minDate {string} — Minimum selectable date in YYYY-MM-DD (optional, defaults to IST today).
 *   showNarrowWeekday {boolean} — Use narrow (M, T, W...) vs short (Mon, Tue...) labels (optional, default false).
 */
export default function WeekStripCalendar({
  selectedDate,
  onSelect,
  minDate,
  showNarrowWeekday = false,
}) {
  const today = useMemo(() => getISTToday(), []);
  const effectiveMinDate = minDate || today;

  // Compute the week start (Sunday) for the selected date
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);

  // Get the 7 dates for this week
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Month/year label for the week (use middle day for month label)
  const monthLabel = useMemo(() => getMonthLabel(weekDates[3]), [weekDates]);

  // Check if we can navigate to previous week
  const prevWeekStart = useMemo(() => addDays(weekStart, -7), [weekStart]);
  const prevWeekEnd = useMemo(() => addDays(prevWeekStart, 6), [prevWeekStart]);
  const canGoPrev = !isBeforeDate(prevWeekEnd, effectiveMinDate);

  // Next week is always allowed
  const nextWeekStart = useMemo(() => addDays(weekStart, 7), [weekStart]);

  function handlePrevWeek() {
    if (canGoPrev) {
      onSelect(prevWeekStart);
    }
  }

  function handleNextWeek() {
    onSelect(nextWeekStart);
  }

  function handleDayClick(dateStr) {
    if (isBeforeDate(dateStr, effectiveMinDate)) return;
    onSelect(dateStr);
  }

  function handleKeyDown(event, dateStr) {
    if (isBeforeDate(dateStr, effectiveMinDate)) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(dateStr);
        break;
      case 'ArrowRight':
        event.preventDefault();
        // Focus next day
        break;
      case 'ArrowLeft':
        event.preventDefault();
        // Focus previous day
        break;
      default:
        return;
    }
  }

  return (
    <div className="week-strip-calendar" role="region" aria-label="Weekly date selector">
      <header className="week-strip-calendar__header">
        <button
          type="button"
          className="week-strip-calendar__nav week-strip-calendar__nav--prev"
          onClick={handlePrevWeek}
          disabled={!canGoPrev}
          aria-label="Previous week"
          aria-disabled={!canGoPrev}
        >
          <svg
            className="week-strip-calendar__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="week-strip-calendar__month" aria-live="polite">
          {monthLabel}
        </div>

        <button
          type="button"
          className="week-strip-calendar__nav week-strip-calendar__nav--next"
          onClick={handleNextWeek}
          aria-label="Next week"
        >
          <svg
            className="week-strip-calendar__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </header>

      <div className="week-strip-calendar__grid" role="listbox" aria-label="Days of the week">
        {weekDates.map((dateStr) => {
          const selected = isSameDate(dateStr, selectedDate);
          const todayFlag = isToday(dateStr);
          const disabled = isBeforeDate(dateStr, effectiveMinDate);
          const weekdayLabel = showNarrowWeekday
            ? getWeekdayNarrow(dateStr)
            : getWeekdayShort(dateStr);
          const dayNumber = getDayNumber(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              role="option"
              className={`week-strip-calendar__day ${
                selected ? 'week-strip-calendar__day--selected' : ''
              } ${todayFlag ? 'week-strip-calendar__day--today' : ''} ${
                disabled ? 'week-strip-calendar__day--disabled' : ''
              }`}
              onClick={() => handleDayClick(dateStr)}
              onKeyDown={(e) => handleKeyDown(e, dateStr)}
              disabled={disabled}
              aria-selected={selected}
              aria-disabled={disabled}
              aria-label={formatDateLabel(dateStr)}
              tabIndex={selected ? 0 : disabled ? -1 : 0}
            >
              <span className="week-strip-calendar__weekday">{weekdayLabel}</span>
              <span className="week-strip-calendar__date">{dayNumber}</span>
              {todayFlag && !selected && (
                <span className="week-strip-calendar__today-indicator" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}