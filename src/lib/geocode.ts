// src/lib/geocode.ts
import type { VenueLocation } from '@/lib/api/venues';
import { isLikelyValidCoords } from '@/utils/geo';

// src/lib/geocode.ts
const GEO_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

// 1) Short-circuit junky queries and wrap fetch in try/catch
export async function geocodeAddress(q: string) {
  const normalized = q.trim();
  if (normalized.length < 3) return null; // avoid single letters etc.

  const key = keyFor(normalized);
  const cached = readCache(key);
  if (cached) return cached;

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=` +
    encodeURIComponent(normalized);

  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    if (!isFinite(coords.lat) || !isFinite(coords.lng)) return null;

    writeCache(key, coords);
    return coords;
  } catch {
    return null; // network errors etc.
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
    .map((s) => s.trim())
    .filter(Boolean);

  // de-dupe
  const unique = [...new Set(candidates)];

  for (const q of unique) {
    const hit = await geocodeAddress(q);
    if (hit && isLikelyValidCoords(hit.lat, hit.lng)) return hit;
  }
  return null;
}
