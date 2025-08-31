import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import BookingCalendar from '@/components/venues/BookingCalendar';
import { type Booking, createBooking, deleteBooking } from '@/lib/api/bookings';
import { getVenueById, type Venue } from '@/lib/api/venues';
import { dateOnly } from '@/utils/date';

type Props = {
  booking: Booking;
  venueId: string; // <-- required (no non-null assertions!)
  onClose: () => void;
  onUpdated?: () => void; // parent can refetch
};

export default function ChangeBookingDialog({ booking, venueId, onClose, onUpdated }: Props) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guests, setGuests] = useState(() => booking.guests);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(booking.dateFrom),
    to: new Date(booking.dateTo),
  }));

  const handleSelect = (r: DateRange | undefined) => setRange(r);

  // fetch fresh venue (+bookings) for availability check
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const v = await getVenueById(venueId, { bookings: true });
        if (!active) return;
        setVenue(v);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [venueId]);

  // availability check (ignore the booking we’re editing)
  const check = useCallback(
    (from: Date, to: Date, g: number) => {
      if (!venue) return false;
      if (g < 1 || g > venue.maxGuests) return false;
      const start = +from;
      const end = +to;
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;

      const overlaps = (venue.bookings ?? [])
        .filter((b) => b.id !== booking.id) // ignore current booking
        .some((b) => {
          const bStart = Date.parse(b.dateFrom);
          const bEnd = Date.parse(b.dateTo); // treat as checkout (exclusive)
          return start < bEnd && bStart < end;
        });

      return !overlaps;
    },
    [venue, booking.id],
  );

  const canBook = useMemo(() => {
    if (!venue) return false;
    if (!range?.from || !range?.to) return false;
    return check(range.from, range.to, guests);
  }, [venue, range, guests, check]);

  async function save() {
    if (!venue) return;
    if (!range?.from || !range?.to) return;
    if (!canBook) return;

    setBusy(true);
    try {
      await deleteBooking(booking.id);
      await createBooking({
        venueId,
        dateFrom: dateOnly(range.from),
        dateTo: dateOnly(range.to),
        guests,
      });
      toast.success('Booking updated');
      onUpdated?.();
      onClose();
    } catch (e) {
      toast.error((e as Error).message ?? 'Could not update booking');
    } finally {
      setBusy(false);
    }
  }

  const bookingsLite = useMemo(
    () =>
      (venue?.bookings ?? [])
        .filter((b) => b.id !== booking.id)
        .map((b) => ({ dateFrom: b.dateFrom, dateTo: b.dateTo })),
    [venue?.bookings, booking.id],
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Change booking</h3>
          <button onClick={onClose} className="text-sm underline">
            Close
          </button>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-danger">Error: {error}</p>
        ) : !venue ? (
          <p className="text-muted">Venue not found.</p>
        ) : (
          <>
            <div className="mb-3 text-sm text-muted">Max guests: {venue.maxGuests}</div>

            <BookingCalendar bookings={bookingsLite} selected={range} onSelect={handleSelect} />

            <div className="mt-3 flex items-center gap-3">
              <label className="text-sm">
                Guests
                <input
                  type="number"
                  min={1}
                  max={venue.maxGuests}
                  value={guests}
                  onChange={(e) =>
                    setGuests(Math.max(1, Math.min(venue.maxGuests, Number(e.target.value) || 1)))
                  }
                  className="ml-2 w-20 input-field"
                />
                <span className="ml-2 opacity-70">/ max {venue.maxGuests}</span>
              </label>

              <Button
                onClick={save}
                disabled={!canBook || busy}
                isLoading={busy}
                className="ml-auto"
                variant="form"
              >
                Save changes
              </Button>
            </div>

            {!canBook && (
              <p className="mt-2 text-xs text-danger">
                Pick valid dates (no overlap) and a guest count within the venue’s limit.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
