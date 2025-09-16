/** @file geocode – tiny client-side geocoding helper + cache for venue locations. */

import type { VenueLocation } from '@/types/common';

/** What we return from geocoders and the cache. */
export type GeocodeHit = {
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
  /** Optional human-friendly label (e.g., "Oslo, Norway"). */
  label?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Local cache TTL for geocode results (7 days). */
const GEO_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Narrowing helper: non-empty string. */
const isString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Parse a number from unknown (accepts numeric strings). */
const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

/** Normalize a query for hashing/caching. */
const normalize = (q: string) => q.trim().replace(/\s+/g, ' ');

/** Cache key for a query. */
const keyFor = (q: string) => `geocode:${normalize(q).toLowerCase()}`;

type CacheShape = { v: unknown; t: number };

/**
 * Read and validate a cached geocode entry from localStorage.
 * Returns `null` on any shape/version/TTL mismatch.
 */
function readCache(key: string): GeocodeHit | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const t = (parsed as Partial<CacheShape>).t;
    if (typeof t !== 'number') return null;
    if (Date.now() - t > GEO_TTL_MS) return null;

    const v = (parsed as Partial<CacheShape>).v;
    if (!v || typeof v !== 'object') return null;

    const obj = v as Record<string, unknown>;
    const lat = toNum(obj.lat);
    const lng = toNum(obj.lng);
    if (!Number.isFinite(lat ?? NaN) || !Number.isFinite(lng ?? NaN)) return null;

    const label = isString(obj.label) ? obj.label : undefined;
    return { lat: lat!, lng: lng!, label };
  } catch {
    return null;
  }
}

/** Write a geocode hit to localStorage with a timestamp. */
function writeCache(key: string, v: GeocodeHit) {
  localStorage.setItem(key, JSON.stringify({ v, t: Date.now() }));
}

/**
 * Safely extract the first feature's `properties` object from a Geoapify response.
 * Works against `unknown` without assuming the server shape.
 */
function firstFeatureProps(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object') return null;
  const features = (json as { features?: unknown }).features;
  if (!Array.isArray(features) || features.length === 0) return null;
  const first = features[0];
  if (!first || typeof first !== 'object') return null;
  const props = (first as { properties?: unknown }).properties;
  if (!props || typeof props !== 'object') return null;
  return props as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Geocode a freeform address string via Geoapify.
 * - Uses a 7-day localStorage cache keyed by a normalized, lowercase query.
 * - Returns `null` on network errors or low-quality inputs.
 *
 * @param q - Freeform query (e.g., `"Karl Johans gate 1, Oslo, Norway"`).
 * @returns A {@link GeocodeHit} or `null`.
 */
export async function geocodeAddress(q: string): Promise<GeocodeHit | null> {
  const API_KEY = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined;
  const normalized = normalize(q);
  if (!API_KEY || normalized.length < 3) return null;

  const cacheKey = keyFor(normalized);
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const url =
    `https://api.geoapify.com/v1/geocode/search` +
    `?text=${encodeURIComponent(normalized)}&limit=1&lang=en&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = (await res.json()) as unknown;
    const p = firstFeatureProps(json);
    if (!p) return null;

    const lat = toNum(p.lat);
    const lng = toNum(p.lon); // Geoapify uses 'lon'
    if (!Number.isFinite(lat ?? NaN) || !Number.isFinite(lng ?? NaN) || (lat === 0 && lng === 0))
      return null;

    const cityLike =
      (p.city as unknown) ??
      p.town ??
      p.village ??
      p.hamlet ??
      p.municipality ??
      p.county ??
      p.state;

    const country = p.country;
    const formatted = p.formatted ?? p.name;

    const label =
      [cityLike, country]
        .map((x) => (isString(x) ? x : ''))
        .filter(Boolean)
        .join(', ') || (isString(formatted) ? formatted : undefined);

    const hit: GeocodeHit = { lat: lat!, lng: lng!, label };
    writeCache(cacheKey, hit);
    return hit;
  } catch {
    return null;
  }
}

/**
 * Try several structured variants in order until one geocodes:
 * 1. `"address, city, country"`
 * 2. `"city, country"`
 * 3. `"country"`
 *
 * @param loc - Venue location fields from the API.
 * @returns A {@link GeocodeHit} or `null` if none of the variants work.
 */
export async function geocodeFromLocation(loc?: VenueLocation): Promise<GeocodeHit | null> {
  if (!loc) return null;

  const candidates = [
    [loc.address, loc.city, loc.country].filter(isString).join(', '),
    [loc.city, loc.country].filter(isString).join(', '),
    isString(loc.country) ? loc.country : '',
  ]
    .map(normalize)
    .filter(Boolean);

  const unique = [...new Set(candidates)];
  for (const q of unique) {
    const hit = await geocodeAddress(q);
    if (hit) return hit;
  }
  return null;
}

/**
 * Read a cached geocode (if present) for `{address, city, country}` without network requests.
 *
 * @param loc - Venue location.
 * @returns A cached {@link GeocodeHit} or `null` if absent/expired/invalid.
 */
export function getCachedForLocation(loc?: VenueLocation): GeocodeHit | null {
  if (!loc) return null;
  const normalized = [loc.address, loc.city, loc.country]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .join(', ')
    .toLowerCase();
  if (!normalized) return null;

  const key = `geocode:${normalized}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      v: { lat: number; lng: number; label?: string };
      t: number;
    };
    const { lat, lng, label } = parsed.v || {};
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng, label };
  } catch {
    /* ignore */
  }
  return null;
}
