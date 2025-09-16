/** @file ChangeBookingDialog – modal to edit a booking's dates/guests with availability checks. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import BookingCalendar from '@/components/venues/BookingCalendar';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { type Booking, createBooking, deleteBooking } from '@/lib/api/bookings';
import { getVenueById, type Venue } from '@/lib/api/venues';
import { dateOnly } from '@/utils/date';

type Props = {
  /** The booking being edited. */
  booking: Booking;
  /** Venue id for availability and constraints. */
  venueId: string;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Optional callback after a successful update (e.g., to refresh parent lists). */
  onUpdated?: () => void;
};

/**
 * A modal dialog that lets users change a booking's date range and guests.
 * Loads the venue with its bookings, ignores the current booking when
 * checking overlap, and replaces the booking with a new one on save.
 */
export default function ChangeBookingDialog({ booking, venueId, onClose, onUpdated }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guests, setGuests] = useState(() => booking.guests);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(booking.dateFrom),
    to: new Date(booking.dateTo),
  }));

  /** Normalize reversed clicks; otherwise just set the selected range. */
  function handleSelect(r: DateRange | undefined): void {
    if (r?.from && r?.to && r.to < r.from) setRange({ from: r.to, to: r.from });
    else setRange(r);
  }

  /** Trap focus in the panel, close on Escape, and restore focus on unmount. */
  useFocusTrap(panelRef, { active: true, onEscape: onClose, restoreFocus: true });

  const titleId = 'change-booking-title';

  /** Fetch the venue with bookings used for overlap checks. */
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

  /**
   * Validate a proposed booking segment against venue rules and existing bookings.
   * Ignores the booking currently being edited.
   */
  const check = useCallback(
    (from: Date, to: Date, g: number): boolean => {
      if (!venue) return false;
      if (g < 1 || g > venue.maxGuests) return false;

      const start = +from;
      const end = +to;
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;

      const overlaps = (venue.bookings ?? [])
        .filter((b) => b.id !== booking.id)
        .some((b) => {
          const bStart = Date.parse(b.dateFrom);
          const bEnd = Date.parse(b.dateTo); // checkout (exclusive)
          return start < bEnd && bStart < end;
        });

      return !overlaps;
    },
    [venue, booking.id],
  );

  /** Whether the current selection is a valid, available booking. */
  const canBook = useMemo(() => {
    if (!venue) return false;
    if (!range?.from || !range?.to) return false;
    return check(range.from, range.to, guests);
  }, [venue, range, guests, check]);

  /**
   * Persist changes by deleting the original booking and creating a new one
   * with the selected dates and guest count.
   */
  async function save(): Promise<void> {
    if (!venue || !range?.from || !range?.to || !canBook) return;

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

  /** Minimal booking list for the calendar to mark unavailable ranges. */
  const bookingsLite = useMemo(
    () =>
      (venue?.bookings ?? [])
        .filter((b) => b.id !== booking.id)
        .map((b) => ({ dateFrom: b.dateFrom, dateTo: b.dateTo })),
    [venue?.bookings, booking.id],
  );

  /** Number of nights in the current selection (min 1 when both dates set). */
  const nights =
    range?.from && range?.to ? Math.max(1, Math.round((+range.to - +range.from) / 86400000)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl outline-none"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-semibold">
            Change booking
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
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

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted" aria-live="polite">
                {range?.from && range?.to
                  ? `${nights} night${nights > 1 ? 's' : ''} selected`
                  : 'Pick check-in and check-out'}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRange(undefined)}
                  title="Clear selected dates"
                >
                  <span aria-hidden>🧹</span>
                  <span className="ml-1">Clear dates</span>
                </Button>

                <Button
                  onClick={save}
                  disabled={busy || !range?.from || !range?.to || !canBook}
                  isLoading={busy}
                  variant="primary"
                  size="sm"
                >
                  Save changes
                </Button>
              </div>
            </div>

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
                  className="ml-2 w-20 field"
                />
                <span className="ml-2 text-muted">/ max {venue.maxGuests}</span>
              </label>
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
