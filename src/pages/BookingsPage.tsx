// src/pages/BookingsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import BookingCard from '@/components/bookings/BookingCard';
import ChangeBookingDialog from '@/components/bookings/ChangeBookingDialog';
import { type Booking, deleteBooking, getMyBookings } from '@/lib/api/bookings';
import { useAuthStore } from '@/store/authStore';

function byDateFromAsc(a: Booking, b: Booking) {
  return new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime();
}
function isPast(b: Booking, now = new Date()) {
  return new Date(b.dateTo).getTime() < now.getTime();
}

export default function BookingsPage() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.name) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getMyBookings(user.name, true); // _venue=true
        setRows([...data].sort(byDateFromAsc));
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.name]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return rows.filter((b) => !isPast(b, now));
  }, [rows]);

  const past = useMemo(() => {
    const now = new Date();
    return rows.filter((b) => isPast(b, now));
  }, [rows]);

  const [editing, setEditing] = useState<Booking | null>(null);

  function openChange(b: Booking) {
    if (b.venue?.id) setEditing(b);
  }
  function closeDialog() {
    setEditing(null);
  }
  async function refetchBookings() {
    if (!user?.name) return;
    const fresh = await getMyBookings(user.name, true);
    setRows(fresh.sort(byDateFromAsc));
  }

  async function cancel(id: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id));
    try {
      await deleteBooking(id);
      const fresh = await getMyBookings(user!.name, true);
      setRows(fresh.sort(byDateFromAsc));
      toast.success('Booking cancelled');
    } catch (e) {
      setRows(prev);
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
            <ul className="grid gap-4 lg:grid-cols-2">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <BookingCard
                    booking={b}
                    onCancel={cancel}
                    onChangeDates={openChange}
                    busy={busyId === b.id} // optional: let the card disable its Cancel button
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming bookings.</p>
          )}

          <h2 className="text-lg font-semibold mt-6">Past</h2>
          {past.length ? (
            <ul className="grid gap-4 lg:grid-cols-2">
              {past.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-4 rounded border border-border-light bg-card p-3 opacity-80"
                >
                  {b.venue?.media?.[0]?.url ? (
                    <img
                      src={b.venue.media[0].url}
                      alt={b.venue.media[0].alt || b.venue.name || 'Venue image'}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {new Date(b.dateFrom).toLocaleDateString()} →{' '}
                      {new Date(b.dateTo).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted">Guests {b.guests}</div>
                    {b.venue && (
                      <div className="mt-1">
                        <div className="font-semibold line-clamp-1">{b.venue.name}</div>
                        {b.venue.location?.city && (
                          <div className="text-sm text-muted">{b.venue.location.city}</div>
                        )}
                      </div>
                    )}
                  </div>
                  {editing?.venue?.id && (
                    <ChangeBookingDialog
                      booking={editing}
                      venueId={editing.venue.id}
                      onClose={closeDialog}
                      onUpdated={refetchBookings}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No past bookings.</p>
          )}
        </>
      )}
    </section>
  );
}
