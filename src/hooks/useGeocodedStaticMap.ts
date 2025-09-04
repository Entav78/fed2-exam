// src/hooks/useGeocodedStaticMap.ts
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Venue } from '@/lib/api/venues';
import { geocodeFromLocation, getCachedForLocation } from '@/lib/geocode';
import type { VenueLocation } from '@/types/common';
import { isLikelyValidCoords } from '@/utils/geo';
import { buildStaticMapUrl, getVenueImage, PLACEHOLDER_IMG } from '@/utils/venueImage';

type Opts = { width?: number; height?: number; zoom?: number };

export function useGeocodedStaticMap(
  venue: Pick<Venue, 'id' | 'name' | 'location' | 'media'>,
  index = 0,
  opts?: Opts,
) {
  // 1) Derive stable dimensions from opts
  const dims = useMemo(
    () => ({
      w: opts?.width ?? 400,
      h: opts?.height ?? 240,
      z: opts?.zoom ?? 13,
    }),
    [opts?.width, opts?.height, opts?.zoom],
  );

  // 2) Build base image using dims
  const base = useMemo(
    () => getVenueImage(venue, index, { width: dims.w, height: dims.h, zoom: dims.z }),
    [venue, index, dims.w, dims.h, dims.z],
  );

  const [src, setSrc] = useState(base.src);
  const [alt, setAlt] = useState(base.alt);
  const ioRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setSrc(base.src);
    setAlt(base.alt);
  }, [base.src, base.alt]);

  const loc: VenueLocation | undefined = venue.location as VenueLocation | undefined;

  useEffect(() => {
    if (src !== PLACEHOLDER_IMG) return; // already have photo or static map
    if (!loc) return;

    // a) cached coords?
    const cached = getCachedForLocation(loc);
    if (cached) {
      setSrc(buildStaticMapUrl(cached.lat, cached.lng, dims.w, dims.h, dims.z));
      return;
    }

    // b) API already has coords?
    const hasApiCoords = isLikelyValidCoords(loc.lat ?? undefined, loc.lng ?? undefined);
    if (hasApiCoords) return;

    // c) Geocode lazily when visible
    const el = ioRef.current;
    if (!el) return;

    let active = true;
    const run = async () => {
      const hit = await geocodeFromLocation(loc);
      if (active && hit) {
        setSrc(buildStaticMapUrl(hit.lat, hit.lng, dims.w, dims.h, dims.z));
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    io.observe(el);
    return () => {
      active = false;
      io.disconnect();
    };
  }, [
    src,
    loc,
    venue.id,
    venue.location?.address,
    venue.location?.city,
    venue.location?.country,
    dims.w,
    dims.h,
    dims.z,
  ]);

  return { src, alt, ioRef };
}
