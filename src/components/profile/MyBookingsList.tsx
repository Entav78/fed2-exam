import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    if (!user?.name) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getMyBookings(user.name, true); // _venue=true
        setRows([...data].sort(byStartAsc));
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.name]);

  const now = new Date();
  const isPast = (b: Booking) => new Date(b.dateTo).getTime() < now.getTime();

  const hasData = rows.length > 0;

  async function cancel(id: string) {
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id)); // optimistic
    try {
      await deleteBooking(id);
      toast.success('Booking cancelled');
    } catch (e) {
      setRows(prev); // rollback
      toast.error((e as Error).message ?? 'Could not cancel booking');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading bookings…</p>;
  if (error) return <p className="text-danger text-sm">Error: {error}</p>;
  if (!hasData) return <p className="text-sm text-muted">You haven’t made any bookings yet.</p>;

  return (
    <div className="space-y-4">
      {rows.map((b) => {
        const img = b.venue?.media?.[0];
        const city = b.venue?.location?.city;
        return (
          <div
            key={b.id}
            className={`flex items-center gap-4 rounded border border-border-light bg-card p-4 shadow ${
              isPast(b) ? 'opacity-80' : ''
            }`}
          >
            {/* thumbnail */}
            {img?.url ? (
              <img
                src={img.url}
                alt={img.alt || b.venue?.name || 'Venue image'}
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded bg-muted" />
            )}

            {/* info */}
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight line-clamp-1">{b.venue?.name ?? 'Venue'}</p>
              {city && <p className="text-sm text-muted">{city}</p>}
              <p className="mt-1 text-sm">
                {new Date(b.dateFrom).toLocaleDateString()} →{' '}
                {new Date(b.dateTo).toLocaleDateString()} • Guests {b.guests}
              </p>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              <Link
                to={`/venues/${b.venue?.id ?? ''}`}
                className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
              >
                Open
              </Link>
              {!isPast(b) && (
                <button
                  onClick={() => cancel(b.id)}
                  disabled={busyId === b.id}
                  className={`rounded border border-border-light px-3 py-1 text-sm ${
                    busyId === b.id ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted'
                  }`}
                >
                  {busyId === b.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
