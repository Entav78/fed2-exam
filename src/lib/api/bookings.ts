import {
  API_PROFILES,
  buildHeaders,
  getBookingByIdUrl,
  listBookingsUrl,
} from '@/lib/api/constants';
import type { Media, ProfileLite, VenueLocation, VenueMeta } from '@/types/common';

// ---------- Types ----------

/** Minimal venue shape that may be embedded on bookings when requested. */
export type VenueLite = {
  id: string;
  name: string;
  description?: string;
  media: Media[];
  price: number;
  maxGuests: number;
  rating?: number;
  created?: string; // ISO
  updated?: string; // ISO
  meta?: VenueMeta;
  location?: VenueLocation;
  owner?: ProfileLite;
};

/** Base booking properties. */
export type BookingBase = {
  id: string;
  dateFrom: string; // ISO
  dateTo: string; // ISO
  guests: number;
  created?: string; // ISO
  updated?: string; // ISO
};

/** Booking with optional embedded relations (depending on query params). */
export type Booking = BookingBase & {
  /** Present if requested with `_venue=true`. */
  venue?: VenueLite;
  /** Present if requested with `_customer=true`. */
  customer?: ProfileLite;
};

/**
 * Shape accepted by UI when creating a booking.
 * Either pass a `venueId` directly, or `venue: { id }`.
 */
export type CreateBookingInput = { dateFrom: string; dateTo: string; guests: number } & (
  | { venueId: string }
  | { venue: { id: string } }
);

/** Payload sent to the API (normalized). */
type CreateBookingPayload = {
  dateFrom: string;
  dateTo: string;
  guests: number;
  venueId: string;
};

// ---------- Internal JSON helper ----------

/**
 * Fetch JSON with common headers and typed result.
 *
 * - Adds `Content-Type: application/json` for non-GET/HEAD requests (if missing).
 * - Throws `Error` with a message derived from API error payload (if available).
 *
 * @typeParam T - Expected JSON response type.
 * @param url - Absolute or relative request URL.
 * @param init - Optional `fetch` init options.
 * @returns Parsed JSON typed as `T`.
 * @throws Error when `res.ok` is false; message includes API error if present.
 */
async function getJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toString().toUpperCase();

  const headers: Record<string, string> = {
    ...buildHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };

  // Add Content-Type only when the request has a body
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {
      /* response may be empty */
    }
    throw new Error(msg);
  }

  // Most endpoints return JSON (204 handled by callers where applicable)
  return res.json() as Promise<T>;
}

// ---------- API ----------

/**
 * List all bookings.
 *
 * @returns Array of bookings (relations depend on calling endpoint flags).
 * @example
 * const bookings = await fetchBookings();
 */
export async function fetchBookings(): Promise<Booking[]> {
  const url = listBookingsUrl();
  const json = await getJSON<{ data: Booking[] }>(url);
  return json.data;
}

/**
 * Get a single booking by ID.
 *
 * @param id - Booking ID.
 * @param opts - Include related entities via flags.
 * @returns The booking (optionally with `venue`/`customer`).
 * @example
 * const b = await getBookingById(id, { venue: true });
 */
export async function getBookingById(
  id: string,
  opts?: { venue?: boolean; customer?: boolean },
): Promise<Booking> {
  const url = getBookingByIdUrl(id, opts);
  const json = await getJSON<{ data: Booking }>(url);
  return json.data;
}

/**
 * Create a booking.
 *
 * Accepts either `{ venueId }` or `{ venue: { id } }`. Internally normalizes to `venueId`
 * and also includes `venue: { id }` for broader API compatibility (harmless if ignored).
 *
 * @param body - Create booking input (dates, guests, and venue reference).
 * @returns The created booking.
 * @example
 * await createBooking({ venueId, dateFrom: '2025-09-20', dateTo: '2025-09-22', guests: 2 });
 */
export async function createBooking(body: CreateBookingInput): Promise<Booking> {
  const url = listBookingsUrl();

  // Normalize to an id either way
  const id = 'venueId' in body ? body.venueId : body.venue.id;

  const payload: CreateBookingPayload = {
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    guests: body.guests,
    venueId: id, // required by the backend
  };

  const json = await getJSON<{ data: Booking }>(url, {
    method: 'POST',
    body: JSON.stringify({ ...payload, venue: { id } }), // sending both is safe
  });
  return json.data;
}

/**
 * Delete a booking by ID.
 *
 * @param id - Booking ID to delete.
 * @returns Resolves on success (204 No Content).
 * @throws Error when the API responds with a non-2xx code.
 * @example
 * await deleteBooking(id);
 */
export async function deleteBooking(id: string): Promise<void> {
  const url = getBookingByIdUrl(id);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {
      /* body might be empty on error */
    }
    throw new Error(msg);
  }
  // success is 204 No Content — do NOT parse JSON
}

/**
 * Get bookings for a specific profile (the “My bookings” view).
 *
 * @param profileName - Profile name (username).
 * @param withVenue - If true, include the `venue` relation (`_venue=true`).
 * @returns Array of bookings belonging to the profile.
 * @example
 * const mine = await getMyBookings('jane.doe', true);
 */
export async function getMyBookings(profileName: string, withVenue = true): Promise<Booking[]> {
  const qs = new URLSearchParams();
  if (withVenue) qs.set('_venue', 'true');
  const url = `${API_PROFILES}/${encodeURIComponent(profileName)}/bookings?${qs.toString()}`;
  const json = await getJSON<{ data: Booking[] }>(url);
  return json.data;
}

// ---------- Small UI helper ----------

/**
 * Check whether a booking is currently active at a given moment.
 *
 * @param b - Booking-like object with `dateFrom`/`dateTo`.
 * @param now - Moment to compare (default: current time).
 * @returns `true` if `now` is within `[dateFrom, dateTo]` inclusive.
 */
export function isBookingActive(b: BookingBase, now = new Date()): boolean {
  const start = new Date(b.dateFrom).getTime();
  const end = new Date(b.dateTo).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}
