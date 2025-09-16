/** @file MyBookingsList – shows upcoming bookings with a compact row card and edit/cancel actions. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import BookingCard from '@/components/bookings/BookingCard';
import ChangeBookingDialog from '@/components/bookings/ChangeBookingDialog';
import { type Booking, deleteBooking, getMyBookings } from '@/lib/api/bookings';
import { useAuthStore } from '@/store/authStore';

/** Sort helper: earlier start date first. */
function byStartAsc(a: Booking, b: Booking) {
  return new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime();
}

/**
 * MyBookingsList
 *
 * Loads the current user's bookings (with venue data), filters out past items,
 * shows up to LIMIT upcoming bookings, and supports cancel/change-dates.
 *
 * Perf:
 *  - Renders a same-height skeleton while loading to avoid layout shifts.
 *  - Thumbnails inside BookingCard reserve space (intrinsic size) and lazy-load.
 */
export default function MyBookingsList() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Dialog state for changing a booking
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const openChange = (b: Booking) => setEditBooking(b);
  const closeChange = () => setEditBooking(null);

  /** Fetch the current user's bookings, sorted ascending by start date. */
  const fetchMine = useCallback(async () => {
    if (!user?.name) return;
    const data = await getMyBookings(user.name, true); // _venue=true
    setRows([...data].sort(byStartAsc));
  }, [user?.name]);

  /** Initial load with race-safety. */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        await fetchMine();
        if (active) setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchMine]);

  const LIMIT = 4;

  /** Stable local-midnight boundary (computed once per mount). */
  const todayMidnightMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  /** Upcoming bookings only (end date after today), sorted soonest first. */
  const upcomingOnly = useMemo(
    () =>
      rows
        .filter((b) => new Date(b.dateTo).getTime() > todayMidnightMs)
        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()),
    [rows, todayMidnightMs],
  );

  /** The limited slice shown on the profile preview. */
  const visible = useMemo(() => upcomingOnly.slice(0, LIMIT), [upcomingOnly]);

  /**
   * Cancel a booking with optimistic UI + rollback on failure.
   * @param id Booking id to cancel
   */
  async function cancel(id: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id)); // optimistic remove
    try {
      await deleteBooking(id);
      toast.success('Booking cancelled');
      await fetchMine(); // keep in sync after server write
    } catch (e) {
      setRows(prev); // rollback
      toast.error(e instanceof Error ? e.message : 'Could not cancel booking');
    } finally {
      setBusyId(null);
    }
  }

  // --- Render states (loading → error → empty → list) ---

  if (loading) {
    return (
      <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr">
        <li>
          <div className="card min-h-[112px] flex items-center gap-4 p-4">
            <div className="h-16 w-24 rounded border border-border bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-24 bg-muted rounded border border-border" />
              <div className="h-8 w-16 bg-muted rounded border border-border" />
            </div>
          </div>
        </li>
      </ul>
    );
  }

  if (error) return <p className="text-danger text-sm">Error: {error}</p>;
  if (!upcomingOnly.length) return <p className="text-sm text-muted">No upcoming bookings.</p>;

  return (
    <>
      <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr">
        {visible.map((b) => (
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

      {rows.length > LIMIT && (
        <div className="mt-3">
          <Link
            to="/bookings"
            className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
          >
            View all bookings
          </Link>
        </div>
      )}

      {/* Dialog only when we have a venue id */}
      {editBooking?.venue?.id && (
        <ChangeBookingDialog
          booking={editBooking}
          venueId={editBooking.venue.id}
          onClose={closeChange}
          onUpdated={fetchMine}
        />
      )}
    </>
  );
}
