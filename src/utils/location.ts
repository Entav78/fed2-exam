// src/utils/location.ts
import type { VenueLocation } from '@/lib/api/venues';

export function formatLocation(l?: VenueLocation, fallback = ''): string {
  if (!l) return fallback;
  const parts = [l.address, l.city, l.country].filter(Boolean);
  return parts.length ? parts.join(', ') : fallback;
}
