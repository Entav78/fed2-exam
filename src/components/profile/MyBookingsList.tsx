import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

//import { Link } from 'react-router-dom';
import BookingCard from '@/components/bookings/BookingCard';
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

  const hasData = rows.length > 0;

  async function cancel(id: string) {
    if (!confirm('Cancel this booking?')) return;
    const prev = rows;
    setBusyId(id);
    setRows((r) => r.filter((b) => b.id !== id)); // optimistic
    try {
      await deleteBooking(id);
      toast.success('Booking cancelled');
    } catch (e) {
      setRows(prev); // rollback
      toast.error(e instanceof Error ? e.message : 'Could not cancel booking');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading bookings…</p>;
  if (error) return <p className="text-danger text-sm">Error: {error}</p>;
  if (!hasData) return <p className="text-sm text-muted">You haven’t made any bookings yet.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          onCancel={(id) => {
            if (!confirm('Are you sure you want to cancel this booking?')) return;
            cancel(id);
          }}
          busy={busyId === b.id}
        />
      ))}
    </div>
  );
}
