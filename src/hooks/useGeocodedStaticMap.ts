/** @file useGeocodedStaticMap – pick the best venue image (photo → cached static map → lazy geocoded map). */

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Venue } from '@/lib/api/venues';
import { geocodeFromLocation, getCachedForLocation } from '@/lib/geocode';
import type { VenueLocation } from '@/types/common';
import { isLikelyValidCoords } from '@/utils/geo';
import { buildStaticMapUrl, getVenueImage, PLACEHOLDER_IMG } from '@/utils/venueImage';

/** Optional size/zoom options for the map or photo. */
type Opts = { width?: number; height?: number; zoom?: number };

/**
 * useGeocodedStaticMap
 *
 * Returns an image `src`/`alt` for a venue:
 * 1) Uses the venue photo (if present) at the requested size.
 * 2) Otherwise, uses a cached static map for the venue (if available).
 * 3) Otherwise, if the API has valid lat/lng, it will rely on that (no geocode).
 * 4) Otherwise, lazily geocodes when the referenced `<img ref={ioRef}>` enters viewport,
 *    then swaps in a static map image URL.
 *
 * Dimensions are stabilized from `opts` to avoid layout shifts.
 *
 * @param venue - The venue (id, name, media, location) to derive imagery from.
 * @param index - Media index to prefer when multiple images exist (default: 0).
 * @param opts  - Optional desired width/height/zoom (defaults: 400×240, zoom 13).
 * @returns `{ src, alt, ioRef }` – `src`/`alt` for an `<img>`, and an `ioRef` to attach for lazy geocoding.
 *
 * @example
 * const { src, alt, ioRef } = useGeocodedStaticMap(venue, 0, { width: 640, height: 256 });
 * return <img ref={ioRef} src={src} alt={alt} width={640} height={256} />;
 */
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

  // Keep state in sync with base when inputs change
  useEffect(() => {
    setSrc(base.src);
    setAlt(base.alt);
  }, [base.src, base.alt]);

  const loc: VenueLocation | undefined = venue.location as VenueLocation | undefined;

  useEffect(() => {
    // If we already have a real photo or a static map, nothing to do.
    if (src !== PLACEHOLDER_IMG) return;
    if (!loc) return;

    // (a) Try cached geocode for this location first.
    const cached = getCachedForLocation(loc);
    if (cached) {
      setSrc(buildStaticMapUrl(cached.lat, cached.lng, dims.w, dims.h, dims.z));
      return;
    }

    // (b) If API already has lat/lng, we won't geocode here.
    const hasApiCoords = isLikelyValidCoords(loc.lat ?? undefined, loc.lng ?? undefined);
    if (hasApiCoords) return;

    // (c) Otherwise lazily geocode when the img comes into view.
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
