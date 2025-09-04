// src/hooks/useGeocodedStaticMap.ts
import { useEffect, useMemo, useState } from 'react';

import type { Venue } from '@/lib/api/venues';
import { geocodeAddress } from '@/lib/geocode';
import { buildStaticMapUrl, getVenueImage, PLACEHOLDER_IMG } from '@/utils/venueImage';

type Opts = { width?: number; height?: number; zoom?: number };

export function useGeocodedStaticMap(
  venue: Pick<Venue, 'id' | 'name' | 'media' | 'location'>,
  index = 0,
  opts: Opts = {},
) {
  const { width = 400, height = 240, zoom = 13 } = opts;

  // base (photo → static map if coords already on venue in PROD → SVG)
  const base = useMemo(
    () => getVenueImage(venue, index, { width, height, zoom }),
    [venue, index, width, height, zoom],
  );

  const [src, setSrc] = useState(base.src);
  const [alt, setAlt] = useState(base.alt);

  // primitive deps (avoid object deps)
  const name = venue.name ?? '';
  const address = venue.location?.address ?? '';
  const city = venue.location?.city ?? '';
  const country = venue.location?.country ?? '';

  useEffect(() => {
    // reset to the base every time inputs change
    setSrc(base.src);
    setAlt(base.alt);

    // Only try geocode in PROD and only if we're still on the SVG placeholder
    if (!import.meta.env.PROD) return;
    if (base.src !== PLACEHOLDER_IMG) return;

    // Build query candidates from most to least specific
    const tries = Array.from(
      new Set(
        [
          [address, city, country].filter(Boolean).join(', '),
          [city, country].filter(Boolean).join(', '),
          country || '',
          name &&
            [name, [city, country].filter(Boolean).join(', ') || ''].filter(Boolean).join(', '),
          name || '',
        ]
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

    if (!tries.length) return;

    let cancelled = false;

    (async () => {
      const keyPresent = Boolean(import.meta.env.VITE_GEOAPIFY_KEY);
      if (!keyPresent) return; // bail gracefully if key missing

      for (const q of tries) {
        const hit = await geocodeAddress(q);
        if (cancelled) return;
        if (hit) {
          setSrc(buildStaticMapUrl(hit.lat, hit.lng, width, height, zoom));
          setAlt(`Map of ${name || 'venue'}`);
          return;
        }
      }
      // keep SVG if all fail
    })();

    return () => {
      cancelled = true;
    };
  }, [base.src, base.alt, name, address, city, country, width, height, zoom]);

  return { src, alt };
}
