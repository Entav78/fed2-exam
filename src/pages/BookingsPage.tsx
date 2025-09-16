import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import BookingCard from '@/components/bookings/BookingCard';
import ChangeBookingDialog from '@/components/bookings/ChangeBookingDialog';
import { type Booking, deleteBooking, getMyBookings } from '@/lib/api/bookings';
import { useAuthStore } from '@/store/authStore';

/**
 * Sort helper: ascending by `dateFrom`.
 * @param a - First booking.
 * @param b - Second booking.
 * @returns Negative if `a` starts earlier than `b`, positive if later, 0 if equal.
 */
function byDateFromAsc(a: Booking, b: Booking): number {
  return new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime();
}

/**
 * Returns whether a booking has ended at or before the given local midnight.
 * (Treats `dateTo` as checkout day; anything ending on/before today’s midnight is considered “past”.)
 * @param b - Booking to test.
 * @param todayMidnight - A Date object at local midnight.
 */
function isPastLocal(b: Booking, todayMidnight: Date): boolean {
  return new Date(b.dateTo).getTime() <= todayMidnight.getTime();
}

/**
 * BookingsPage
 *
 * Displays the signed-in user’s bookings, split into “Upcoming” and “Past”.
 * - Fetches bookings for the current user on mount and when edits occur.
 * - Supports optimistic cancellation with rollback on failure.
 * - Allows changing dates via a dialog (mounted once at the end of the page).
 */
export default function BookingsPage() {
  const user = useAuthStore((s) => s.user);

  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Derive a stable primitive for effect deps
  const username = user?.name ?? '';

  // Local midnight boundary (stable for memo deps)
  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!username) return;

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getMyBookings(username, true);
        if (!active) return;
        setRows([...data].sort(byDateFromAsc));
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
  }, [username]);

  const upcoming = useMemo(
    () => rows.filter((b) => !isPastLocal(b, todayMidnight)).sort(byDateFromAsc),
    [rows, todayMidnight],
  );

  const past = useMemo(
    () =>
      rows
        .filter((b) => isPastLocal(b, todayMidnight))
        .sort((a, b) => new Date(b.dateTo).getTime() - new Date(a.dateTo).getTime()),
    [rows, todayMidnight],
  );

  const [editing, setEditing] = useState<Booking | null>(null);

  function openChange(b: Booking) {
    if (b.venue?.id) setEditing(b);
  }
  function closeDialog() {
    setEditing(null);
  }

  const refetchBookings = async () => {
    if (!username) return;
    const fresh = await getMyBookings(username, true);
    setRows(fresh.sort(byDateFromAsc));
  };

  async function cancel(id: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id)); // optimistic
    try {
      await deleteBooking(id);
      const fresh = await getMyBookings(username, true);
      setRows(fresh.sort(byDateFromAsc));
      toast.success('Booking cancelled');
    } catch (e) {
      setRows(prev); // rollback
      toast.error((e as Error).message ?? 'Could not cancel booking');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">My bookings</h1>

      {!rows.length ? (
        <p className="text-muted">You don’t have any bookings yet.</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Upcoming</h2>
          {upcoming.length ? (
            <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <BookingCard
                    booking={b}
                    onCancel={cancel}
                    onChangeDates={openChange}
                    busy={busyId === b.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming bookings.</p>
          )}

          <h2 className="text-lg font-semibold mt-6">Past</h2>
          {past.length ? (
            <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr">
              {past.map((b) => (
                <li key={b.id}>
                  <BookingCard booking={b} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No past bookings.</p>
          )}
        </>
      )}

      {editing?.venue?.id && (
        <ChangeBookingDialog
          booking={editing}
          venueId={editing.venue.id}
          onClose={closeDialog}
          onUpdated={refetchBookings}
        />
      )}
    </section>
  );
}
