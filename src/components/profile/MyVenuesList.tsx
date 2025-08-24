// src/components/profile/MyVenuesList.tsx
import { useEffect, useState } from 'react';

import VenueCard from '@/components/venues/VenueCard';
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

  return (
    // 1 column by default, 2 columns from md breakpoint and up
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((v) => (
        <VenueCard
          key={v.id}
          venue={v}
          layout="row" // ← compact horizontal card
          showManage
          className="h-full" // keep buttons aligned at the bottom when content wraps
        />
      ))}
    </div>
  );
}
