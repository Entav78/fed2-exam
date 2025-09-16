/** @file useVenueAvailability – fetch a venue (with bookings) and expose an availability checker. */

import { useCallback, useEffect, useState } from 'react';

import { getVenueById, isVenueAvailable, type Venue } from '@/lib/api/venues';

/**
 * useVenueAvailability
 *
 * Loads a venue (including bookings) and returns:
 * - `venue`: the fetched venue (or `null` while loading/absent)
 * - `loading`: fetch-in-progress flag
 * - `error`: error message when the fetch fails
 * - `check(fromISO, toISO, guests)`: predicate that returns `true` if the venue is available
 *   for the given ISO date range and guest count; returns `false` if the venue isn't loaded yet
 *   or the range conflicts.
 *
 * @param venueId - Venue ID to load (if omitted, no request is made).
 * @returns An object with `{ venue, loading, error, check }`.
 *
 * @example
 * const { venue, loading, error, check } = useVenueAvailability(id);
 * const canBook = check('2025-09-20', '2025-09-23', 3);
 */
export function useVenueAvailability(venueId?: string) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const v = await getVenueById(venueId, { bookings: true });
        if (active) setVenue(v);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [venueId]);

  const check = useCallback(
    (fromISO: string, toISO: string, guests: number) =>
      venue ? isVenueAvailable(venue, fromISO, toISO, guests) : false,
    [venue],
  );

  return { venue, loading, error, check };
}
