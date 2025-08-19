import { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import { isBefore, startOfToday } from 'date-fns';

import type { BookingLite } from '@/utils/bookings';
import { bookingsToDisabledRanges } from '@/utils/bookings';

import 'react-day-picker/dist/style.css';

type Props = {
  bookings: BookingLite[];
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  numberOfMonths?: number;
};

export default function BookingCalendar({
  bookings,
  selected,
  onSelect,
  numberOfMonths = 2,
}: Props) {
  const disabled = useMemo(() => {
    const today = startOfToday(); // moved here
    const booked = bookingsToDisabledRanges(bookings);
    return [{ before: today }, ...booked];
  }, [bookings]);

  // Style booked days red, while also disabling them
  const modifiers = useMemo(() => {
    const booked = bookingsToDisabledRanges(bookings);
    return { booked };
  }, [bookings]);

  const modifiersStyles = {
    booked: { backgroundColor: '#b91c1c', color: 'white' }, // tailwind red-700
  };

  return (
    <div className="rounded-lg border border-border-light bg-card p-3">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={numberOfMonths}
        disabled={disabled}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        showOutsideDays
        weekStartsOn={1}
      />
      {selected?.from && selected?.to && isBefore(selected.to, selected.from) && (
        <p className="mt-2 text-danger text-sm">End date can’t be before start date.</p>
      )}
    </div>
  );
}
