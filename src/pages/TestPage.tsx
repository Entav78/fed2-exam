import { useEffect, useState } from 'react';

import { type Booking, fetchBookings } from '@/lib/api/bookings';

export default function BookingsTest() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBookings({
          page: 1,
          limit: 20,
          sort: 'dateFrom',
          sortOrder: 'asc',
          venue: true,
          customer: true,
        });
        setRows(data);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!rows.length) return <p>Loading…</p>;

  return (
    <ul className="space-y-2">
      {rows.map((b) => (
        <li key={b.id} className="p-3 rounded border border-border-light bg-white">
          <div>
            <strong>{b.venue?.name ?? 'Unknown venue'}</strong> —{' '}
            {new Date(b.dateFrom).toLocaleDateString()} → {new Date(b.dateTo).toLocaleDateString()}{' '}
            — guests: {b.guests}
          </div>
          <div className="text-sm text-muted">Customer: {b.customer?.name ?? 'n/a'}</div>
        </li>
      ))}
    </ul>
  );
}
