// src/utils/venueImage.ts
import type { SyntheticEvent } from 'react';

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

function staticMapUrlOSM(lat: number, lng: number, w = 400, h = 240, zoom = 13) {
  // Public demo service; fine for light usage. Keep OSM attribution on your page.
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${w}x${h}&markers=${lat},${lng},lightblue1`;
}

// ---------- Public API ----------
/**
 * Returns {src, alt} for a venue image.
 * Order: media[0] → static map (if coords) → inline placeholder.
 */
export function getVenueImage(venue: WithMedia, index = 0, opts?: GetVenueImageOpts) {
  const url = venue?.media?.[index]?.url?.trim();
  const alt =
    venue?.media?.[index]?.alt?.trim() ||
    (venue?.name ? String(venue.name) : undefined) ||
    'Venue image';

  // Real photo available
  if (url) return { src: url, alt };

  // Fallback: static map if we have coordinates
  const coords = getLatLng(venue);
  if (coords) {
    const w = opts?.width ?? 400;
    const h = opts?.height ?? 240;
    const zoom = opts?.zoom ?? 13;
    const src = staticMapUrlOSM(coords.lat, coords.lng, w, h, zoom);
    return { src, alt: `Map of ${venue?.name ?? 'venue'}` };
  }

  // Final fallback: inline SVG placeholder
  return { src: PLACEHOLDER_IMG, alt };
}

/** Swap broken images to the placeholder (prevents error loops). */
export function handleImgErrorToPlaceholder(e: SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
}
