// components/manager/UpcomingBookingsPanel.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getManagerUpcomingBookings, type ManagerUpcomingRow } from '@/lib/api/manager';
import { useAuthStore } from '@/store/authStore';

export default function UpcomingBookingsPanel() {
  const name = useAuthStore((s) => s.user?.name);
  const [rows, setRows] = useState<ManagerUpcomingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    getManagerUpcomingBookings(name)
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [name]);

  if (!name) return null;

  return (
    <section className="rounded border border-border bg-card p-3">
      <h2 className="mb-2 text-lg font-semibold">Upcoming bookings</h2>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {err && (
        <p className="text-sm text-danger" role="alert">
          {err}
        </p>
      )}

      {!loading && !err && rows.length === 0 && (
        <p className="text-sm text-muted">No upcoming bookings.</p>
      )}

      <ul className="space-y-2">
        {rows.slice(0, 6).map((row) => (
          <li key={row.booking.id} className="rounded border border-border p-2">
            <div className="flex items-center justify-between">
              <Link to={`/manage`} className="font-medium hover:underline">
                {row.venueName}
              </Link>
              <span className="text-sm text-muted">
                {new Date(row.booking.dateFrom).toLocaleDateString()} →{' '}
                {new Date(row.booking.dateTo).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm text-muted">
              Guests: {row.booking.guests}
              {/* add a Manage link to the exact venue if you want: /manage/:id */}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
