import { useEffect, useMemo, useState } from 'react';

import type { Venue } from '@/lib/api/venues';
import { getVenueImage, PLACEHOLDER_IMG } from '@/utils/venueImage';

type Opts = { width?: number; height?: number; zoom?: number };

function buildStaticMapUrl(lat: number, lng: number, w = 400, h = 240, z = 13) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${z}&size=${w}x${h}&markers=${lat},${lng},lightblue1`;
}

export function useGeocodedStaticMap(
  venue: Pick<Venue, 'id' | 'name' | 'media' | 'location'>,
  index = 0,
  opts: Opts = {},
) {
  // ✅ destructure to stable primitives
  const { width = 400, height = 240, zoom = 13 } = opts;

  const base = useMemo(
    () => getVenueImage(venue, index, { width, height, zoom }),
    // ✅ depend on primitives (not the opts object)
    [venue, index, width, height, zoom],
  );

  const [src, setSrc] = useState(base.src);
  const [alt, setAlt] = useState(base.alt);

  useEffect(() => {
    setSrc(base.src);
    setAlt(base.alt);

    if (!import.meta.env.PROD) return;
    if (base.src !== PLACEHOLDER_IMG) return;

    const q = [venue.location?.address, venue.location?.city, venue.location?.country]
      .filter(Boolean)
      .join(', ');
    if (!q) return;

    const key = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined;
    if (!key) return;

    const cacheKey = `geo:${q.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        setSrc(buildStaticMapUrl(lat, lng, width, height, zoom));
        setAlt(`Map of ${venue.name ?? 'venue'}`);
        return;
      } catch {}
    }

    let cancelled = false;
    fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=1&apiKey=${key}`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        if (cancelled) return;
        const p = json?.features?.[0]?.properties;
        const lat = Number(p?.lat);
        const lng = Number(p?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          localStorage.setItem(cacheKey, JSON.stringify({ lat, lng }));
          setSrc(buildStaticMapUrl(lat, lng, width, height, zoom));
          setAlt(`Map of ${venue.name ?? 'venue'}`);
        }
      })
      .catch(() => {
        /* keep SVG */
      });

    // ✅ include primitives used inside
    return () => {
      cancelled = true;
    };
  }, [
    base.src,
    base.alt,
    venue.name,
    venue.location?.address,
    venue.location?.city,
    venue.location?.country,
    width,
    height,
    zoom,
  ]);

  return { src, alt };
}
