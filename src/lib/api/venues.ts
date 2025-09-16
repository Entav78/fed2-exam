/** @file venues – typed models and fetch helpers for Holidaze venues. */

import type { Media, ProfileLite, VenueLocation, VenueMeta } from '@/types/common';

import {
  API_PROFILES,
  API_VENUES,
  buildHeaders,
  getVenueByIdUrl,
  listVenuesUrl,
} from './constants';

/** Minimal booking shape returned when a venue is expanded with `_bookings=true`. */
export type BookingLite = {
  id: string;
  /** Check-in date (ISO). */
  dateFrom: string;
  /** Check-out date (ISO, exclusive). */
  dateTo: string;
  guests: number;
};

/** Venue entity (optionally expanded with owner/bookings). */
export type Venue = {
  id: string;
  name: string;
  description?: string;
  media: Media[];
  price: number;
  maxGuests: number;
  rating?: number;
  meta?: VenueMeta;
  location?: VenueLocation;
  created?: string; // ISO timestamp
  updated?: string; // ISO timestamp

  /** Present when requested with `_bookings=true`. */
  bookings?: BookingLite[];

  /** Present when requested with `_owner=true` (or `{ owner: true }`). */
  owner?: ProfileLite;
};

/** Payload for creating/updating a venue. */
export type VenueInput = {
  name: string;
  description?: string;
  /** Array of images `{ url, alt? }`. */
  media?: Media[];
  price: number;
  maxGuests: number;
  rating?: number;
  /** Amenities flags. */
  meta?: VenueMeta;
  /** Optional location details (may include lat/lng if known). */
  location?: VenueLocation;
};

/**
 * Fetch JSON with Holidaze headers and normalized error messages.
 * @throws Error with a derived message on non-2xx responses.
 */
async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: buildHeaders(), ...init });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.clone().json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {
      /* ignore non-JSON */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// -------- server-first list --------

/** Query options for listing venues from the server. */
export type FetchVenuesParams = {
  /** Free-text search. */
  q?: string;
  /** Sort key. */
  sort?: 'created' | 'price' | 'rating';
  /** Sort direction. */
  sortOrder?: 'asc' | 'desc';
  /** Page index (1-based). */
  page?: number;
  /** Page size. */
  limit?: number;
  /** Include `owner` object. */
  owner?: boolean;
  /** Include `bookings` array. */
  bookings?: boolean;
};

/**
 * List venues from the API (server-side filtering/sorting/paging).
 * @param params - See {@link FetchVenuesParams}.
 * @returns Array of {@link Venue}.
 */
export async function fetchVenues(params: FetchVenuesParams = {}): Promise<Venue[]> {
  const url = listVenuesUrl(params);
  const json = await getJSON<{ data: Venue[] }>(url);
  return json.data;
}

/**
 * Get a single venue by id, optionally expanding owner/bookings.
 * @param id - Venue id.
 * @param opts - Expansion flags.
 * @returns The {@link Venue}.
 */
export async function getVenueById(
  id: string,
  opts?: { owner?: boolean; bookings?: boolean },
): Promise<Venue> {
  const url = getVenueByIdUrl(id, opts);
  const json = await getJSON<{ data: Venue }>(url);
  return json.data;
}

/**
 * Create a new venue.
 * @param body - Venue fields to create.
 * @returns The created {@link Venue}.
 * @throws Error with API-derived message on failure.
 */
export async function createVenue(body: VenueInput): Promise<Venue> {
  const url = `${API_VENUES}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders('POST'), // ensure Content-Type
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.errors?.[0]?.message ?? json?.message ?? 'Create failed');
  return json.data as Venue;
}

/**
 * Update an existing venue.
 * @param id - Venue id.
 * @param body - Partial fields to update.
 * @returns The updated {@link Venue}.
 * @throws Error with API-derived message on failure.
 */
export async function updateVenue(id: string, body: Partial<VenueInput>): Promise<Venue> {
  const url = `${API_VENUES}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders('PUT'), // ensure Content-Type
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.errors?.[0]?.message ?? json?.message ?? 'Update failed');
  return json.data as Venue;
}

/**
 * Delete a venue.
 * @param id - Venue id.
 * @returns Resolves on success; throws on failure.
 * @throws Error with API-derived message on failure.
 */
export async function deleteVenue(id: string): Promise<void> {
  const url = `${API_VENUES}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'DELETE', headers: buildHeaders('DELETE') });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
}

/**
 * Get venues owned by a profile (optionally including bookings).
 * @param profileName - Profile username.
 * @param withBookings - When true, expands each venue’s `bookings`.
 * @returns Array of {@link Venue}.
 * @throws Error with API-derived message on failure.
 */
export async function getMyVenues(profileName: string, withBookings = true): Promise<Venue[]> {
  const qs = new URLSearchParams();
  if (withBookings) qs.set('_bookings', 'true');
  const url = `${API_PROFILES}/${encodeURIComponent(profileName)}/venues?${qs}`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const msg = j?.errors?.[0]?.message ?? j?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const json = (await res.json()) as { data: Venue[] };
  return json.data;
}

/**
 * Check whether a venue is available for a given date range and guest count.
 *
 * Rules:
 * - `dateTo` is treated as **checkout (exclusive)**.
 * - Overlap condition: there is a conflict if `start < bEnd && bStart < end`.
 *
 * @param venue - Venue to check (should include `maxGuests` and optionally `bookings`).
 * @param fromISO - Check-in date (ISO).
 * @param toISO - Check-out date (ISO, exclusive).
 * @param guests - Number of guests.
 * @returns `true` if the range does not overlap any existing booking and `guests` ≤ `maxGuests`.
 *
 * @example
 * isVenueAvailable(venue, '2025-09-20', '2025-09-23', 3); // → true/false
 */
export function isVenueAvailable(venue: Venue, fromISO: string, toISO: string, guests: number) {
  if (!fromISO || !toISO) return false;
  if (guests > venue.maxGuests) return false;

  const start = Date.parse(fromISO);
  const end = Date.parse(toISO);

  // Treat dateTo as "checkout" (exclusive). Overlap rule: start < bEnd && bStart < end
  const overlaps = (venue.bookings ?? []).some((b) => {
    const bStart = Date.parse(b.dateFrom);
    const bEnd = Date.parse(b.dateTo);
    return start < bEnd && bStart < end;
  });

  return !overlaps;
}
