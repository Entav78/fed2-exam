/** @file MyVenuesList – shows the current user's venues with a compact row card and a "show all" toggle. */

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import VenueCard from '@/components/venues/VenueCard';
import { API_PROFILES, buildHeaders } from '@/lib/api/constants';
import type { Venue } from '@/lib/api/venues';
import { useAuthStore } from '@/store/authStore';

import NewVenueTile from '../venues/NewVenueTile';

/**
 * Derive upcoming/active bookings from a venue's bookings array.
 *
 * - Treats "today" as inclusive (bookings ending today still count).
 * - Returns the list sorted by `dateFrom` ascending so index 0 is the next one.
 *
 * @param bookings  Raw venue bookings (`dateFrom`/`dateTo` ISO strings).
 * @param from      Reference date (defaults to now).
 * @returns         Sorted array of bookings that are active or in the future.
 */
function getUpcoming(
  bookings: { dateFrom: string; dateTo: string }[] = [],
  from: Date = new Date(),
) {
  const startOfToday = new Date(from);
  startOfToday.setHours(0, 0, 0, 0); // treat “today” as inclusive

  return bookings
    .filter((b) => Date.parse(b.dateTo) >= +startOfToday) // active or future
    .sort((a, b) => Date.parse(a.dateFrom) - Date.parse(b.dateFrom));
}

/**
 * MyVenuesList
 *
 * Loads venues owned by the current user (including `_bookings=true` for context),
 * renders a compact row list, and lets the user toggle between a limited preview
 * and the full set.
 *
 * UI details:
 * - Each venue shows a small "N upcoming" badge plus the next booking range when present.
 * - A "Show all / Show fewer" control expands/collapses the list.
 *
 * Performance:
 * - While loading, a skeleton list matches the final card footprint to avoid CLS.
 */
export default function MyVenuesList() {
  const user = useAuthStore((s) => s.user);

  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Initial fetch (includes bookings for each venue)
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

  // Loading skeleton (same general footprint as final list to prevent layout jumps)
  if (loading) {
    return (
      <>
        <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr list-none p-0 m-0">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <div className="card flex items-center gap-4 p-4">
                <div className="h-32 w-32 rounded border border-border bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                  <div className="h-3 w-1/5 bg-muted rounded" />
                </div>
                <div className="ml-auto flex gap-2">
                  <div className="h-8 w-16 bg-muted rounded border border-border" />
                  <div className="h-8 w-20 bg-muted rounded border border-border" />
                </div>
              </div>
            </li>
          ))}
          {/* matches the NewVenueTile slot */}
          <li>
            <div className="card flex items-center gap-4 p-4">
              <div className="h-32 w-32 rounded border border-border bg-muted shrink-0" />
              <div className="flex-1 h-4 bg-muted rounded" />
            </div>
          </li>
        </ul>
        {/* matches the "Show all" button row so the height doesn't jump */}
        <div className="mt-3">
          <div className="h-9 w-40 rounded border border-border bg-muted" />
        </div>
      </>
    );
  }

  if (error) return <p className="text-danger text-sm">Error: {error}</p>;
  if (!rows.length)
    return <p className="text-sm text-muted">You haven’t created any venues yet.</p>;

  const LIMIT = 3;
  const visible = expanded ? rows : rows.slice(0, LIMIT);
  const listId = 'my-venues-list';

  return (
    <>
      <ul id={listId} className="grid gap-4 xl:grid-cols-2 auto-rows-fr list-none p-0 m-0">
        {visible.map((v) => {
          const upcoming = getUpcoming(v.bookings ?? []);
          const next = upcoming[0];

          return (
            <li key={v.id}>
              <VenueCard venue={v} layout="row" showManage className="min-h-[112px]" />

              {upcoming.length > 0 && (
                <div className="mt-1 text-xs text-muted flex items-center gap-2">
                  <span className="rounded-full bg-success/10 text-success px-2 py-0.5">
                    {upcoming.length} upcoming
                  </span>
                  {next && (
                    <span>
                      Next: {new Date(next.dateFrom).toLocaleDateString()} →{' '}
                      {new Date(next.dateTo).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}

        <li>
          <NewVenueTile className="min-h-[112px]" />
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
