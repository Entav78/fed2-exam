import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import BookingCard from '@/components/bookings/BookingCard';
import ChangeBookingDialog from '@/components/bookings/ChangeBookingDialog';
import { type Booking, deleteBooking, getMyBookings } from '@/lib/api/bookings';
import { useAuthStore } from '@/store/authStore';

function byStartAsc(a: Booking, b: Booking) {
  return new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime();
}

export default function MyBookingsList() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // NEW: dialog state
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const openChange = (b: Booking) => setEditBooking(b);
  const closeChange = () => setEditBooking(null);

  const fetchMine = useCallback(async () => {
    if (!user?.name) return;
    const data = await getMyBookings(user.name, true); // _venue=true
    setRows([...data].sort(byStartAsc));
  }, [user?.name]);

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

  // Stable local-midnight boundary (only computed once per mount)
  const todayMidnightMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const upcomingOnly = useMemo(
    () =>
      rows
        .filter((b) => new Date(b.dateTo).getTime() > todayMidnightMs)
        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()),
    [rows, todayMidnightMs],
  );

  const visible = useMemo(() => upcomingOnly.slice(0, LIMIT), [upcomingOnly]);

  // Optional clearer empty state
  if (!upcomingOnly.length) {
    return <p className="text-sm text-muted">No upcoming bookings.</p>;
  }

  async function cancel(id: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id)); // optimistic
    try {
      await deleteBooking(id);
      toast.success('Booking cancelled');
      await fetchMine(); // keep in sync
    } catch (e) {
      setRows(prev); // rollback
      toast.error(e instanceof Error ? e.message : 'Could not cancel booking');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading bookings…</p>;
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
              onChangeDates={openChange} // ✅ opens dialog
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
          onUpdated={fetchMine} // refresh preview after change
        />
      )}
    </>
  );
}
