import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { type Booking, deleteBooking, getMyBookings } from '@/lib/api/bookings';
import { useAuthStore } from '@/store/authStore';

function isPast(b: Booking, nowTs: number) {
  return new Date(b.dateTo).getTime() < nowTs;
}

export default function MyBookingsList() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.name) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getMyBookings(user.name, true);
        setRows(data);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.name]);

  const nowTs = Date.now();
  const upcoming = useMemo(() => rows.filter((b) => !isPast(b, nowTs)), [rows, nowTs]).slice(0, 5);
  const past = useMemo(() => rows.filter((b) => isPast(b, nowTs)), [rows, nowTs]).slice(0, 3);

  async function cancel(id: string) {
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id));
    try {
      await deleteBooking(id);
      toast.success('Booking cancelled');
    } catch (e) {
      setRows(prev);
      toast.error((e as Error).message ?? 'Could not cancel booking');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading bookings…</p>;
  if (!rows.length) return <p className="text-sm text-muted">No bookings yet.</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Upcoming</h3>
      <ul className="space-y-2">
        {upcoming.map((b) => (
          <li key={b.id} className="rounded border border-border-light bg-card p-3">
            <div className="font-medium">
              {new Date(b.dateFrom).toLocaleDateString()} →{' '}
              {new Date(b.dateTo).toLocaleDateString()}
            </div>
            <div className="text-sm text-muted">Guests {b.guests}</div>
            {b.venue && <div className="text-sm">{b.venue.name}</div>}
            <div className="mt-2">
              <button
                onClick={() => cancel(b.id)}
                disabled={busyId === b.id}
                className={`rounded border border-border-light px-3 py-1 ${busyId === b.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {busyId === b.id ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="font-semibold mt-4">Recent past</h3>
      {past.length ? (
        <ul className="space-y-2">
          {past.map((b) => (
            <li key={b.id} className="rounded border border-border-light bg-card p-3 opacity-80">
              <div className="font-medium">
                {new Date(b.dateFrom).toLocaleDateString()} →{' '}
                {new Date(b.dateTo).toLocaleDateString()}
              </div>
              {b.venue && <div className="text-sm">{b.venue.name}</div>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No past bookings.</p>
      )}
    </div>
  );
}
