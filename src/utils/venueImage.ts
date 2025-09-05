// src/utils/venueImage.ts
import type { SyntheticEvent } from 'react';

import { FORCE_STATIC_MAPS, GEOAPIFY_KEY } from '@/lib/config';
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
type NumLike = number | string | null | undefined; // (you already have this)

type ExtendedLoc = Partial<VenueLocation> & {
  latitude?: NumLike;
  longitude?: NumLike;
  lon?: NumLike;
  long?: NumLike;
};

/** Safely read lon/lat from any of the supported keys, no `any` casts */
function coordsFromLocation(loc?: ExtendedLoc | null) {
  const lat = toFiniteNumber(loc?.lat ?? loc?.latitude);
  const lng = toFiniteNumber(loc?.lng ?? loc?.lon ?? loc?.long ?? loc?.longitude);
  if (lat === undefined || lng === undefined) return null;
  return { lat, lng };
}

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

// ---------- Geoapify static map ----------
/**
 * Build a Geoapify Static Map URL.
 * Uses "lonlat:lon,lat" (unencoded) so ":" and "," remain literal.
 * Returns PLACEHOLDER_IMG if no API key is configured.
 */
export function buildStaticMapUrl(lat: number, lng: number, w = 400, h = 240, z = 13): string {
  if (!GEOAPIFY_KEY) return PLACEHOLDER_IMG;

  // Force dot-decimals and correct lon,lat order
  const lonStr = Number(lng).toFixed(6);
  const latStr = Number(lat).toFixed(6);

  const center = `lonlat:${lonStr},${latStr}`;
  const marker = `lonlat:${lonStr},${latStr}`; // simple default marker

  return (
    `https://maps.geoapify.com/v1/staticmap?style=osm-carto` +
    `&width=${w}&height=${h}` +
    `&center=${center}&zoom=${z}` +
    `&marker=${marker}` +
    `&apiKey=${GEOAPIFY_KEY}`
  );
}

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

  // 1) Real photo available
  if (url) return { src: url, alt };

  // 2) Coordinates from API, or from cached geocode if API coords are missing/invalid
  let coords = getLatLng(venue);
  if (!hasValidCoords(coords)) {
    const cached = getCachedForLocation(venue?.location as VenueLocation | undefined);
    if (cached) coords = { lat: cached.lat, lng: cached.lng };
  }

  // 3) Static map if allowed (prod or forced) and coords are valid
  const allowStatic = (import.meta.env.PROD || FORCE_STATIC_MAPS) && hasValidCoords(coords);
  if (allowStatic && coords) {
    const w = opts?.width ?? 400;
    const h = opts?.height ?? 240;
    const z = opts?.zoom ?? 13;
    const src = buildStaticMapUrl(coords.lat, coords.lng, w, h, z);
    return { src, alt: `Map of ${venue?.name ?? 'venue'}` };
  }

  // 4) Final fallback
  return { src: PLACEHOLDER_IMG, alt };
}

/**
 * onError handler that tries: map → placeholder.
 * Use on <img onError={handleImgErrorToMapThenPlaceholder(venue, {width, height, zoom})} />
 */
export function handleImgErrorToMapThenPlaceholder(
  venue: { location?: Partial<VenueLocation> | null } | null | undefined,
  opts?: { width?: number; height?: number; zoom?: number },
) {
  return (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const tried = img.dataset.fallbackTried;

    if (tried === 'map') {
      if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
      img.dataset.fallbackTried = 'placeholder';
      return;
    }

    // ✅ typed, no `any`
    const loc = venue?.location as ExtendedLoc | undefined;
    let coords = coordsFromLocation(loc);

    if (!coords) {
      const cached = getCachedForLocation(loc);
      if (cached) coords = { lat: cached.lat, lng: cached.lng };
    }

    if (coords && (import.meta.env.PROD || FORCE_STATIC_MAPS)) {
      const w = opts?.width ?? 400;
      const h = opts?.height ?? 240;
      const z = opts?.zoom ?? 13;
      const url = buildStaticMapUrl(coords.lat, coords.lng, w, h, z);
      if (url && url !== PLACEHOLDER_IMG) {
        img.src = url;
        img.dataset.fallbackTried = 'map';
        return;
      }
    }

    if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
    img.dataset.fallbackTried = 'placeholder';
  };
}

/** Simple onError fallback straight to placeholder (kept for convenience) */
export function handleImgErrorToPlaceholder(e: SyntheticEvent<HTMLImageElement, Event>) {
  if (e.currentTarget.src !== PLACEHOLDER_IMG) e.currentTarget.src = PLACEHOLDER_IMG;
}
