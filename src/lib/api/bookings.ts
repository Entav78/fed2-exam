import {
  API_PROFILES,
  buildHeaders,
  getBookingByIdUrl,
  listBookingsUrl,
} from '@/lib/api/constants';
import type { Media, ProfileLite, VenueLocation, VenueMeta } from '@/types/common';

// ---------- Types ----------

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

export type BookingBase = {
  id: string;
  dateFrom: string; // ISO
  dateTo: string; // ISO
  guests: number;
  created?: string; // ISO
  updated?: string; // ISO
};

export type Booking = BookingBase & {
  /** present if requested with _venue=true */
  venue?: VenueLite;
  /** present if requested with _customer=true */
  customer?: ProfileLite;
};

/** Input you accept from UI */
export type CreateBookingInput = { dateFrom: string; dateTo: string; guests: number } & (
  | { venueId: string }
  | { venue: { id: string } }
);

/** Payload actually sent to the API */
type CreateBookingPayload = {
  dateFrom: string;
  dateTo: string;
  guests: number;
  venueId: string;
};

// ---------- Internal JSON helper ----------

async function getJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toString().toUpperCase();

  const headers: Record<string, string> = {
    ...buildHeaders(), // ✅ no method string here
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

/** List bookings (client-side paging/sorting done elsewhere) */
export async function fetchBookings(): Promise<Booking[]> {
  const url = listBookingsUrl();
  const json = await getJSON<{ data: Booking[] }>(url);
  return json.data;
}

/** Get a single booking by id (optionally include venue/customer) */
export async function getBookingById(
  id: string,
  opts?: { venue?: boolean; customer?: boolean },
): Promise<Booking> {
  const url = getBookingByIdUrl(id, opts);
  const json = await getJSON<{ data: Booking }>(url);
  return json.data;
}

/** Create a booking (normalizes to venueId and sends both styles for compatibility) */
export async function createBooking(body: CreateBookingInput): Promise<Booking> {
  const url = listBookingsUrl();

  // normalize to an id either way
  const id = 'venueId' in body ? body.venueId : body.venue.id;

  const payload: CreateBookingPayload = {
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    guests: body.guests,
    venueId: id, // required by the backend
    // NOTE: we also send venue:{id} in some variants; harmless if ignored
  };

  const json = await getJSON<{ data: Booking }>(url, {
    method: 'POST',
    body: JSON.stringify({ ...payload, venue: { id } }),
  });
  return json.data;
}

/** Delete a booking (owner/customer can cancel their own) */
export async function deleteBooking(id: string): Promise<void> {
  const url = getBookingByIdUrl(id);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(), // ✅ no method string here
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

/** Convenience for Profile -> "My bookings" */
export async function getMyBookings(profileName: string, withVenue = true): Promise<Booking[]> {
  const qs = new URLSearchParams();
  if (withVenue) qs.set('_venue', 'true');
  const url = `${API_PROFILES}/${encodeURIComponent(profileName)}/bookings?${qs.toString()}`;
  const json = await getJSON<{ data: Booking[] }>(url);
  return json.data;
}

// ---------- Small UI helper ----------

export function isBookingActive(b: BookingBase, now = new Date()): boolean {
  const start = new Date(b.dateFrom).getTime();
  const end = new Date(b.dateTo).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}
