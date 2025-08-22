import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_PROFILES, buildHeaders } from '@/lib/api/constants';
import type { Venue } from '@/lib/api/venues';
import { useAuthStore } from '@/store/authStore';

export default function MyVenuesList() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.name) return;
    (async () => {
      try {
        setLoading(true);
        // include bookings so we can show a tiny count
        const url = `${API_PROFILES}/${encodeURIComponent(user.name)}/venues?_bookings=true`;
        const res = await fetch(url, { headers: buildHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRows(json?.data ?? []);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.name]);

  if (!user?.name) return null;
  if (loading) return <p className="text-sm text-muted">Loading your venues…</p>;
  if (error) return <p className="text-danger text-sm">Error: {error}</p>;
  if (!rows.length)
    return <p className="text-sm text-muted">You haven’t created any venues yet.</p>;

  const now = new Date();

  return (
    <div className="space-y-4">
      {rows.map((v) => {
        const img = v.media?.[0];
        const city = v.location?.city;
        const upcomingCount =
          v.bookings?.filter((b) => new Date(b.dateTo).getTime() >= now.getTime()).length ?? 0;

        return (
          <div
            key={v.id}
            className="flex items-center gap-4 rounded border border-border-light bg-card p-4 shadow"
          >
            {img?.url ? (
              <img
                src={img.url}
                alt={img.alt || v.name}
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded bg-muted" />
            )}

            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight line-clamp-1">{v.name}</p>
              {city && <p className="text-sm text-muted">{city}</p>}
              <p className="mt-1 text-sm">
                NOK {v.price} • Max {v.maxGuests} guests
              </p>
              {!!upcomingCount && (
                <p className="mt-1 text-xs text-muted">{upcomingCount} upcoming booking(s)</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/venues/${v.id}`}
                className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
              >
                Open
              </Link>
              {/* wire up when you have an edit page */}
              <Link
                to={`/manage/${v.id}`}
                className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
              >
                Manage
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
