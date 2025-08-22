import { addDays, parseISO } from 'date-fns';

export type BookingRangeLike = { dateFrom: string; dateTo: string };

export function bookingsToDisabledRanges(bookings: BookingRangeLike[]) {
  return bookings.map((b) => {
    const from = parseISO(b.dateFrom);
    const to = addDays(parseISO(b.dateTo), -1); // checkout is free
    return { from, to };
  });
}
