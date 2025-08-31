import { useCallback, useEffect, useState } from 'react';

import { getVenueById, isVenueAvailable, type Venue } from '@/lib/api/venues';

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
