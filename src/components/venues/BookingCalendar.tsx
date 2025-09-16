/** @file BookingCalendar – range calendar that blocks past/booked days and prevents overlapping selections. */

import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import { addDays, areIntervalsOverlapping, startOfToday } from 'date-fns';

import type { BookingRangeLike } from '@/utils/bookings';
import { bookingsToDisabledRanges } from '@/utils/bookings';

import 'react-day-picker/dist/style.css';

type Props = {
  /** Existing bookings used to disable/mark unavailable dates. */
  bookings: BookingRangeLike[];
  /** The currently selected date range. */
  selected: DateRange | undefined;
  /** Called when the selection changes (or is cleared on conflict). */
  onSelect: (range: DateRange | undefined) => void;
  /** Number of calendar months to render side-by-side (default: 2). */
  numberOfMonths?: number;
};

/**
 * Check whether a selected date range overlaps any booked intervals.
 * @remarks The checkout day is treated as free (exclusive), so we compare
 *          `[from, to - 1 day]` against booked intervals using inclusive bounds.
 * @param range Selected date range
 * @param booked Normalized booked intervals as `{ from: Date; to: Date }[]`
 * @returns `true` if any overlap exists, otherwise `false`
 */
function overlapsBooked(range: DateRange, booked: { from: Date; to: Date }[]) {
  if (!range?.from || !range?.to) return false;

  const sel = { start: range.from, end: addDays(range.to, -1) };
  return booked.some((b) =>
    areIntervalsOverlapping(sel, { start: b.from, end: b.to }, { inclusive: true }),
  );
}

function useResponsiveMonths(defaultMonths = 2) {
  const [months, setMonths] = useState(defaultMonths);
  useEffect(() => {
    const xl = window.matchMedia('(min-width: 1280px)'); // 3 months
    const md = window.matchMedia('(min-width: 640px)'); // 2 months
    const update = () => setMonths(xl.matches ? 3 : md.matches ? 2 : 1);
    update();
    xl.addEventListener('change', update);
    md.addEventListener('change', update);
    return () => {
      xl.removeEventListener('change', update);
      md.removeEventListener('change', update);
    };
  }, []);
  return months;
}

/**
 * BookingCalendar
 *
 * Renders a range picker that:
 * - Disables past days and booked intervals.
 * - Prevents selecting ranges that overlap existing bookings.
 * - Emits `undefined` and shows a conflict message when an invalid range is picked.
 */
export default function BookingCalendar({ bookings, selected, onSelect, numberOfMonths }: Props) {
  const responsiveMonths = useResponsiveMonths(2);
  const bookedIntervals = useMemo(() => bookingsToDisabledRanges(bookings), [bookings]);

  const disabled = useMemo(() => {
    const today = startOfToday();
    return [{ before: today }, ...bookedIntervals];
  }, [bookedIntervals]);

  const [conflict, setConflict] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    setConflict(false);
    if (range?.from && range?.to && overlapsBooked(range, bookedIntervals)) {
      setConflict(true);
      onSelect(undefined);
      return;
    }
    onSelect(range);
  };

  return (
    <div className="inline-block max-w-full rounded-lg border border-border bg-card p-3">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        numberOfMonths={numberOfMonths ?? responsiveMonths}
        disabled={disabled}
        showOutsideDays
        weekStartsOn={1}
        classNames={{
          day_disabled:
            'bg-[rgb(var(--fg))/0.06] text-[rgb(var(--fg))/0.55] line-through cursor-not-allowed',
        }}
      />

      {conflict && (
        <p className="mt-2 text-sm text-danger">
          Those dates include unavailable days. Please choose another range.
        </p>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-[rgb(var(--fg))/0.08] border border-border" />
          Unavailable (past or booked)
        </span>
      </div>
    </div>
  );
}
