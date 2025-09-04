// src/lib/geocode.ts
import type { VenueLocation } from '@/types/common';

// --- cache (7 days) ----------------------------------------------------------
const GEO_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function readCache(key: string) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const { v, t } = JSON.parse(raw) as { v: { lat: number; lng: number }; t: number };
    if (Date.now() - t > GEO_TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}
function writeCache(key: string, v: { lat: number; lng: number }) {
  localStorage.setItem(key, JSON.stringify({ v, t: Date.now() }));
}
function keyFor(q: string) {
  return `geocode:${q.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

// --- helpers -----------------------------------------------------------------
function finite(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}
function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, ' ');
}

// --- PUBLIC: Geoapify-backed geocode ----------------------------------------
export async function geocodeAddress(q: string) {
  const API_KEY = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined;
  const normalized = normalizeQuery(q);
  if (!API_KEY || normalized.length < 3) return null; // no key or junk queries

  const cacheKey = keyFor(normalized);
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const url =
    `https://api.geoapify.com/v1/geocode/search` +
    `?text=${encodeURIComponent(normalized)}&limit=1&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const p = json?.features?.[0]?.properties;
    const lat = Number(p?.lat);
    const lng = Number(p?.lon);

    if (!finite(lat) || !finite(lng) || (lat === 0 && lng === 0)) return null;

    const coords = { lat, lng };
    writeCache(cacheKey, coords);
    return coords;
  } catch {
    return null;
  }
}

// Try multiple variations: full address → "city, country" → "country"
export async function geocodeFromLocation(loc?: VenueLocation) {
  if (!loc) return null;

  const candidates = [
    [loc.address, loc.city, loc.country].filter(Boolean).join(', '),
    [loc.city, loc.country].filter(Boolean).join(', '),
    loc.country ?? '',
  ]
    .map(normalizeQuery)
    .filter(Boolean);

  const unique = [...new Set(candidates)];
  for (const q of unique) {
    const hit = await geocodeAddress(q);
    if (hit) return hit;
  }
  return null;
}
