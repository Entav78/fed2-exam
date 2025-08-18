import { buildHeaders, listBookingsUrl, getBookingByIdUrl } from './constants';

// --- Shared subtypes (aligns with your schema) ---

export type Media = { url: string; alt?: string };

export type ProfileLite = {
  name: string;
  email: string;
  bio?: string;
  avatar?: Media;
  banner?: Media;
};

export type VenueLocation = {
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  continent?: string;
  lat?: number;
  lng?: number;
};

export type VenueMeta = {
  wifi?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  pets?: boolean;
};

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

// --- Booking types ---

export type BookingBase = {
  id: string;
  dateFrom: string; // ISO
  dateTo: string; // ISO
  guests: number;
  created?: string; // ISO
  updated?: string; // ISO
};

/**
 * When you request expansions with `_venue=true` and/or `_customer=true`,
 * these fields will be included by the API.
 */
export type Booking = BookingBase & {
  venue?: VenueLite;
  customer?: ProfileLite;
};

// --- Internal helper ---

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: buildHeaders(), ...init });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {
      // intentionally ignore non-JSON bodies
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// --- API: list & detail ---

/** Get all bookings (use params to expand venue/customer and to page/sort) */
export async function fetchBookings(params?: {
  page?: number;
  limit?: number;
  sort?: 'dateFrom' | 'dateTo' | 'created' | 'updated' | 'guests';
  sortOrder?: 'asc' | 'desc';
  venue?: boolean; // include venue object
  customer?: boolean; // include customer object
}): Promise<Booking[]> {
  const url = listBookingsUrl(params);
  const json = await getJSON<{ data: Booking[] }>(url);
  return json.data;
}

/** Get a single booking by id (optionally include venue/customer) */
export async function getBookingById(
  id: string,
  opts?: { venue?: boolean; customer?: boolean }
): Promise<Booking> {
  const url = getBookingByIdUrl(id, opts);
  const json = await getJSON<{ data: Booking }>(url);
  return json.data;
}

// --- Extras you will likely need soon ---

/** Create a booking */
export async function createBooking(body: {
  dateFrom: string; // ISO
  dateTo: string; // ISO
  guests: number;
  venueId: string;
}): Promise<Booking> {
  const url = listBookingsUrl(); // base /bookings
  const json = await getJSON<{ data: Booking }>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

/** Delete a booking (owner/customer can cancel their own) */
export async function deleteBooking(id: string): Promise<void> {
  const url = getBookingByIdUrl(id);
  await getJSON<void>(url, { method: 'DELETE' });
}

// Small helper you might like in UI
export function isBookingActive(b: BookingBase, now = new Date()) {
  const start = new Date(b.dateFrom).getTime();
  const end = new Date(b.dateTo).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}
