import { useMemo, useState } from 'react';

import { useVenueAvailability } from '@/hooks/useVenueAvailability';
import { type Booking, createBooking, deleteBooking } from '@/lib/api/bookings';

type Props = {
  booking: Booking;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function ChangeBookingDialog({ booking, onClose, onUpdated }: Props) {
  // string | undefined
  const venueId = booking.venue?.id;

  const { venue, loading, error, check } = useVenueAvailability(venueId);

  const [from, setFrom] = useState(booking.dateFrom.slice(0, 10));
  const [to, setTo] = useState(booking.dateTo.slice(0, 10));
  const [guests, setGuests] = useState(booking.guests);
  const [busy, setBusy] = useState(false);

  const canBook = useMemo(() => {
    if (!venueId || !venue) return false;
    if (!from || !to) return false;
    if (guests < 1 || guests > (venue?.maxGuests ?? Infinity)) return false;
    return check(from, to, guests);
  }, [venueId, venue, from, to, guests, check]);

  async function save() {
    if (!venueId || !canBook) return;
    setBusy(true);
    try {
      await deleteBooking(booking.id);
      await createBooking({ venueId, dateFrom: from, dateTo: to, guests });
      onUpdated?.();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Change booking</h3>

        {loading && <p>Loading availability…</p>}
        {error && <p className="text-danger">{error}</p>}

        {/* Use your BookingCalendar here if you have one, or simple inputs */}
        <div className="grid gap-3">
          <label className="block">
            <span className="text-sm">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="text-sm">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="text-sm">Guests</span>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(+e.target.value || 1)}
              className="input-field"
            />
          </label>

          {venue && (
            <p className={`text-sm ${canBook ? 'text-green-600' : 'text-danger'}`}>
              {canBook ? '✓ Available for your dates' : '✕ Not available for your dates'}
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm">
            Close
          </button>
          <button
            onClick={save}
            disabled={!canBook || busy}
            className="rounded bg-brand text-white px-3 py-1 text-sm disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Update booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
