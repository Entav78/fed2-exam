import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import { addDays, areIntervalsOverlapping, startOfToday } from 'date-fns';

import type { BookingLite } from '@/utils/bookings';
import { bookingsToDisabledRanges } from '@/utils/bookings';

// You can keep this here or import it once globally in main.tsx
import 'react-day-picker/dist/style.css';

type Props = {
  bookings: BookingLite[];
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  numberOfMonths?: number;
};

function overlapsBooked(range: DateRange, booked: { from: Date; to: Date }[]) {
  if (!range?.from || !range?.to) return false;

  // Treat checkout day as free
  const sel = { start: range.from, end: addDays(range.to, -1) };

  // Convert booked intervals to { start, end } for date-fns
  return booked.some((b) =>
    areIntervalsOverlapping(sel, { start: b.from, end: b.to }, { inclusive: true }),
  );
}

export default function BookingCalendar({
  bookings,
  selected,
  onSelect,
  numberOfMonths = 2,
}: Props) {
  const bookedIntervals = useMemo(() => bookingsToDisabledRanges(bookings), [bookings]);

  const disabled = useMemo(() => {
    const today = startOfToday(); // keep inside memo to avoid dep warning
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
    <div className="rounded-lg border border-border-light bg-card p-3">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        numberOfMonths={numberOfMonths}
        disabled={disabled}
        showOutsideDays
        weekStartsOn={1}
        // Make disabled days (past + booked) look the same:
        classNames={{
          day_disabled: 'bg-gray-100 text-gray-400 opacity-100 line-through',
        }}
      />

      {conflict && (
        <p className="mt-2 text-sm text-danger">
          Those dates include unavailable days. Please choose another range.
        </p>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-gray-100 border border-gray-300" />
          Unavailable (past or booked)
        </span>
      </div>
    </div>
  );
}
