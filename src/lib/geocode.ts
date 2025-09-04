// src/lib/geocode.ts
import type { VenueLocation } from '@/types/common';

// What we return from geocoders and the cache
export type GeocodeHit = { lat: number; lng: number; label?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const GEO_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const normalize = (q: string) => q.trim().replace(/\s+/g, ' ');
const keyFor = (q: string) => `geocode:${normalize(q).toLowerCase()}`;

type CacheShape = { v: unknown; t: number };

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

function writeCache(key: string, v: GeocodeHit) {
  localStorage.setItem(key, JSON.stringify({ v, t: Date.now() }));
}

// Safely read Geoapify's first feature properties from unknown JSON
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
 * Caches results in localStorage using a normalized key.
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
 * Try several structured variants: "address, city, country" → "city, country" → "country".
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
 * Read a cached geocode (if present) for a venue's {address, city, country}
 * without doing any network request.
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
