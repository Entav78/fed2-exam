import { addDays, parseISO } from 'date-fns';

export type BookingLite = { dateFrom: string; dateTo: string };

/**
 * Convert bookings to DayPicker's interval objects.
 * NOTE: Most booking APIs treat dateTo as the **checkout** date (not staying the night),
 * so we disable up to dateTo - 1. If your API is inclusive, remove the addDays(..., -1).
 */
export function bookingsToDisabledRanges(bookings: BookingLite[]) {
  return bookings.map((b) => {
    const from = parseISO(b.dateFrom);
    const to = addDays(parseISO(b.dateTo), -1); // checkout is free
    return { from, to };
  });
}
