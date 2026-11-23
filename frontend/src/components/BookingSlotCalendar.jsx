import { useMemo } from 'react';
import WeekStripCalendar from './WeekStripCalendar.jsx';
import {
  generateBookingSlots,
  formatTimeLabel,
  isFutureAppointment,
  getISTNowParts,
} from '../utils/dateUtils.js';
import '../styles/booking-slot-calendar.css';

/**
 * BookingSlotCalendar — Combined date + time slot selector.
 *
 * Controlled component: parent owns selectedDate and selectedTime state.
 *
 * Props:
 *   selectedDate {string} — Date in YYYY-MM-DD format (required).
 *   onDateChange {function} — Callback(dateStr) when date changes (required).
 *   selectedTime {string} — Time in HH:MM format (optional).
 *   onTimeChange {function} — Callback(timeStr) when time slot selected (required).
 *   bookedSlots {string[]} — Array of booked time strings in HH:MM format (required).
 *   slots {Array} — Optional custom slots array (defaults to 21 standard slots).
 *   minDate {string} — Minimum selectable date (optional, defaults to IST today).
 *   loadingSlots {boolean} — Whether availability is being fetched (optional).
 */
export default function BookingSlotCalendar({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  bookedSlots = [],
  slots,
  minDate,
  loadingSlots = false,
}) {
  const defaultSlots = useMemo(() => generateBookingSlots(), []);
  const activeSlots = slots || defaultSlots;

  const nowParts = useMemo(() => getISTNowParts(), []);

  // Guard against empty/invalid selectedDate
  const validSelectedDate = (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate))
    ? selectedDate
    : nowParts.date;

  const isTodaySelected = validSelectedDate === nowParts.date;

  // Determine which slots are available for the selected date
  const slotStates = useMemo(() => {
    return activeSlots.map((slot) => {
      const isBooked = bookedSlots.includes(slot.value);
      const isSelected = selectedTime === slot.value;
      // Check if slot is in the past (only relevant for today)
      let isPast = false;
      if (isTodaySelected) {
        isPast = !isFutureAppointment(selectedDate, slot.value);
      }
      const disabled = isBooked || isPast;

      return {
        ...slot,
        isBooked,
        isSelected,
        isPast,
        disabled,
      };
    });
  }, [activeSlots, bookedSlots, selectedTime, selectedDate, isTodaySelected]);

  const hasAvailableSlots = slotStates.some((s) => !s.disabled);
  const allSlotsBooked = slotStates.every((s) => s.isBooked);
  const allSlotsPast = slotStates.every((s) => s.isPast);

  function handleTimeClick(slotValue) {
    const slot = slotStates.find((s) => s.value === slotValue);
    if (slot && !slot.disabled) {
      onTimeChange(slotValue);
    }
  }

  return (
    <div className="booking-slot-calendar" role="region" aria-label="Appointment booking" aria-busy={loadingSlots}>
      {/* Section A: Date Selection */}
      <section className="booking-slot-calendar__date-section" aria-labelledby="date-heading">
        <WeekStripCalendar
          selectedDate={selectedDate}
          onSelect={onDateChange}
          minDate={minDate}
          showNarrowWeekday={false}
        />
      </section>

      {/* Section B: Time Selection */}
      <section className="booking-slot-calendar__time-section" aria-labelledby="time-heading">
        <div className="booking-slot-calendar__time-header">
          <h2 id="time-heading" className="booking-slot-calendar__time-title">
            Choose your preferred time
          </h2>
          {validSelectedDate && (
            <p className="booking-slot-calendar__time-subtitle" aria-live="polite">
              Showing availability for <strong>{validSelectedDate}</strong>
            </p>
          )}
        </div>

        {loadingSlots ? (
          <div className="booking-slot-calendar__loading" role="status" aria-live="polite">
            <span className="booking-slot-calendar__loading-spinner" aria-hidden="true" />
            <span>Checking availability…</span>
          </div>
        ) : !hasAvailableSlots ? (
          <div className="booking-slot-calendar__empty-state" role="status">
            <span className="booking-slot-calendar__empty-icon" aria-hidden="true">🕐</span>
            {allSlotsBooked ? (
              <>
                <p className="booking-slot-calendar__empty-title">
                  No slots available
                </p>
                <p className="booking-slot-calendar__empty-message">
                  All time slots for this date are fully booked. Please choose another
                  date.
                </p>
              </>
            ) : allSlotsPast ? (
              <>
                <p className="booking-slot-calendar__empty-title">
                  No future slots today
                </p>
                <p className="booking-slot-calendar__empty-message">
                  All remaining time slots for today have passed. Please choose a
                  future date.
                </p>
              </>
            ) : (
              <>
                <p className="booking-slot-calendar__empty-title">
                  No slots available
                </p>
                <p className="booking-slot-calendar__empty-message">
                  There are no available time slots for the selected date.
                </p>
              </>
            )}
          </div>
        ) : (
          <div
            className="booking-slot-calendar__slot-grid"
            role="listbox"
            aria-label="Available time slots"
          >
            {slotStates.map((slot) => (
              <button
                key={slot.value}
                type="button"
                role="option"
                className={`booking-slot-calendar__slot ${
                  slot.isSelected
                    ? 'booking-slot-calendar__slot--selected'
                    : ''
                } ${slot.disabled ? 'booking-slot-calendar__slot--disabled' : ''} ${
                  slot.isBooked
                    ? 'booking-slot-calendar__slot--booked'
                    : ''
                } ${slot.isPast ? 'booking-slot-calendar__slot--past' : ''}`}
                onClick={() => handleTimeClick(slot.value)}
                disabled={slot.disabled}
                aria-selected={slot.isSelected}
                aria-disabled={slot.disabled}
                aria-label={slot.isBooked
                  ? `${slot.label}, fully booked`
                  : slot.isPast
                  ? `${slot.label}, past`
                  : `${slot.label}, ${slot.isSelected ? 'selected' : 'available'}`}
                tabIndex={slot.isSelected ? 0 : slot.disabled ? -1 : 0}
              >
                <span className="booking-slot-calendar__slot-time">{slot.label}</span>
                {slot.isBooked && (
                  <span className="booking-slot-calendar__slot-status" aria-hidden="true">
                    Booked
                  </span>
                )}
                {slot.isPast && !slot.isBooked && (
                  <span className="booking-slot-calendar__slot-status" aria-hidden="true">
                    Past
                  </span>
                )}
                {slot.isSelected && !slot.disabled && (
                  <span className="booking-slot-calendar__slot-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}