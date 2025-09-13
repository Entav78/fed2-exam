import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import VenueCard from '@/components/venues/VenueCard';
import { API_PROFILES, buildHeaders } from '@/lib/api/constants';
import type { Venue } from '@/lib/api/venues';
import { useAuthStore } from '@/store/authStore';

import NewVenueTile from '../venues/NewVenueTile';

export default function MyVenuesList() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user?.name) return;
    (async () => {
      try {
        setLoading(true);
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

  const LIMIT = 3;
  const visible = expanded ? rows : rows.slice(0, LIMIT);
  const listId = 'my-venues-list';

  return (
    <>
      <ul id={listId} className="grid gap-4 xl:grid-cols-2 auto-rows-fr list-none p-0 m-0">
        {visible.map((v) => (
          <li key={v.id}>
            <VenueCard venue={v} layout="row" showManage className="min-h-[112px]" />
          </li>
        ))}
        <li>
          <div className="card min-h-[112px] flex items-center justify-center">
            <NewVenueTile />
          </div>
        </li>
      </ul>

      {rows.length > LIMIT && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((s) => !s)}
            aria-expanded={expanded}
            aria-controls={listId}
          >
            {expanded ? 'Show fewer' : `Show all (${rows.length})`}
          </Button>
        </div>
      )}
    </>
  );
}
