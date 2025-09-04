// src/utils/venueImage.ts
import type { SyntheticEvent } from 'react';

import { getCachedForLocation } from '@/lib/geocode';
import type { VenueLocation } from '@/types/common';

// ---------- Base placeholder (inline SVG, no network) ----------
export const PLACEHOLDER_IMG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>
     <rect width='100%' height='100%' fill='#f3f4f6'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       font-family='system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"'
       font-size='16' fill='#9ca3af'>No image</text>
   </svg>`,
)}`;

// ---------- Types ----------
type MediaItem = { url?: string | null; alt?: string | null } | null | undefined;

type LocationLike =
  | Partial<{
      address: string | null;
      city: string | null;
      country: string | null;
      lat: number | string | null;
      lng: number | string | null;
      lon: number | string | null;
      long: number | string | null;
      latitude: number | string | null;
      longitude: number | string | null;
    }>
  | null
  | undefined;

type WithMedia =
  | {
      media?: MediaItem[] | null;
      name?: string | null;
      location?: LocationLike;
    }
  | null
  | undefined;

type GetVenueImageOpts = {
  width?: number;
  height?: number;
  zoom?: number;
};

// ---------- Helpers ----------
type NumLike = number | string | null | undefined;

function toFiniteNumber(v: NumLike): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function coalesceNumber(...vals: NumLike[]): number | undefined {
  for (const v of vals) {
    const n = toFiniteNumber(v);
    if (n !== undefined) return n;
  }
  return undefined;
}

function getLatLng(venue: WithMedia) {
  const loc = venue?.location;
  if (!loc) return null;
  const lat = coalesceNumber(loc.lat, loc.latitude);
  const lng = coalesceNumber(loc.lng, loc.lon, loc.long, loc.longitude);
  return lat !== undefined && lng !== undefined ? { lat, lng } : null;
}

function hasValidCoords(coords: { lat: number; lng: number } | null) {
  if (!coords) return false;
  const { lat, lng } = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false; // avoid (0,0)
  if (lat < -85 || lat > 85 || lng < -180 || lng > 180) return false;
  return true;
}

// Geoapify static map URL (uses your VITE_GEOAPIFY_KEY)
// src/utils/venueImage.ts
// Static map URL (uses "awesome" marker = no icon needed)
// good: no manual encode, decimals with '.'

// src/utils/venueImage.ts (or wherever you keep it)
export function buildStaticMapUrl(lat: number, lng: number, w = 400, h = 240, z = 13) {
  const key = import.meta.env.VITE_GEOAPIFY_KEY;
  if (!key) return PLACEHOLDER_IMG;
  const lon = Number(lng).toFixed(6);
  const la = Number(lat).toFixed(6);
  const color = '%2353423C'; // #53423C encoded
  return (
    `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=${w}&height=${h}` +
    `&center=lonlat:${lon},${la}&zoom=${z}` +
    `&marker=lonlat:${lon},${la};size:48;color:${color}` +
    `&apiKey=${key}`
  );
}

// Option B: URLSearchParams (also safe; it won't encode the ':')
// const url = new URL('https://maps.geoapify.com/v1/staticmap');
// url.searchParams.set('style', 'osm-carto');
// url.searchParams.set('width', String(w));
// url.searchParams.set('height', String(h));
// url.searchParams.set('center', center);
// url.searchParams.set('zoom', String(z));
// url.searchParams.set('marker', marker); // '#…' will become %23 automatically — that's OK
// url.searchParams.set('apiKey', key);
// return url.toString();

// ---------- Public API ----------
/**
 * Returns {src, alt} for a venue image.
 * Order: media[0] → static map (if coords or cached geocode) → inline placeholder.
 */
export function getVenueImage(venue: WithMedia, index = 0, opts?: GetVenueImageOpts) {
  const url = venue?.media?.[index]?.url?.trim();
  const alt =
    venue?.media?.[index]?.alt?.trim() ||
    (venue?.name ? String(venue.name) : undefined) ||
    'Venue image';

  if (url) return { src: url, alt };

  // a) API coords?
  // a) API coords?
  let coords = getLatLng(venue);

  // b) if coords are missing OR invalid (e.g. 0,0), try cached geocode
  if (!hasValidCoords(coords)) {
    const cached = getCachedForLocation(venue?.location as VenueLocation | undefined);
    if (cached) coords = { lat: cached.lat, lng: cached.lng };
  }

  const force = import.meta.env.VITE_FORCE_STATIC_MAPS === 'true';
  const canStaticMap = (import.meta.env.PROD || force) && hasValidCoords(coords);

  if (canStaticMap && coords) {
    const w = opts?.width ?? 400;
    const h = opts?.height ?? 240;
    const z = opts?.zoom ?? 13;
    const src = buildStaticMapUrl(coords.lat, coords.lng, w, h, z);
    return { src, alt: `Map of ${venue?.name ?? 'venue'}` };
  }

  // if we got here, we're falling back to the SVG
  // Toggle logging in prod via ?debugthumbs (set in main.tsx)
  const debugThumbs =
    typeof window !== 'undefined' &&
    (window as Window & { __debugThumbs?: boolean }).__debugThumbs === true;

  const shouldLog = import.meta.env.DEV || (import.meta.env.PROD && debugThumbs);

  if (shouldLog) {
    const w = opts?.width ?? 400;
    const h = opts?.height ?? 240;
    const z = opts?.zoom ?? 13;
    const previewUrl = coords ? buildStaticMapUrl(coords.lat, coords.lng, w, h, z) : null;

    console.log('[thumb fallback]', {
      venue: venue?.name ?? '(unknown)',
      coords, // from API or cache (null if none)
      hasKey: Boolean(import.meta.env.VITE_GEOAPIFY_KEY),
      force: import.meta.env.VITE_FORCE_STATIC_MAPS === 'true',
      canStaticMap:
        (import.meta.env.PROD || import.meta.env.VITE_FORCE_STATIC_MAPS === 'true') &&
        hasValidCoords(coords),
      previewUrl, // paste into address bar to verify
    });
  }

  return { src: PLACEHOLDER_IMG, alt };
}

export function handleImgErrorToPlaceholder(e: SyntheticEvent<HTMLImageElement, Event>) {
  if (e.currentTarget.src !== PLACEHOLDER_IMG) e.currentTarget.src = PLACEHOLDER_IMG;
}
