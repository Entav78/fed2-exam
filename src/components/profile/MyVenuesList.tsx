import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import type { Venue } from '@/lib/api/venues';
import { getMyVenues } from '@/lib/api/venues';
import { useAuthStore } from '@/store/authStore';

export default function MyVenuesList() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.isManager());
  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isManager || !user?.name) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getMyVenues(user.name, true);
        setRows(data);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isManager, user?.name]);

  if (!isManager) return null;
  if (loading) return <p className="text-sm text-muted">Loading your venues…</p>;
  if (!rows.length)
    return <p className="text-sm text-muted">You haven’t created any venues yet.</p>;

  return (
    <div className="space-y-2">
      {rows.map((v) => (
        <div key={v.id} className="rounded border border-border-light bg-card p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{v.name}</div>
              <div className="text-sm text-muted">
                {v.location?.city ?? 'Unknown'}, max {v.maxGuests} guests
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/venues/${v.id}`} className="underline text-brand">
                View
              </Link>
              <Link to={`/manage`} className="underline text-brand">
                Manage
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
