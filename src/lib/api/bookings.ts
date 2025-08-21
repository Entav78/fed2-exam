import {
  API_PROFILES,
  buildHeaders,
  getBookingByIdUrl,
  listBookingsUrl,
} from '@/lib/api/constants';

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

// Optional: a small alias so we don’t inline this shape everywhere
export type BookingInput = Pick<BookingBase, 'dateFrom' | 'dateTo' | 'guests'> & {
  venueId: string;
};

// --- Internal helper ---

// in src/lib/api/bookings.ts
async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toString().toUpperCase();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...buildHeaders(method), // ← ensures Content-Type for POST/PUT/PATCH
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {}
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
  opts?: { venue?: boolean; customer?: boolean },
): Promise<Booking> {
  const url = getBookingByIdUrl(id, opts);
  const json = await getJSON<{ data: Booking }>(url);
  return json.data;
}

// NOTE: some Holidaze variants require `venueId`; others accept `venue: { id }`.
// I send both for compatibility.

type CreateBookingInput = {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  guests: number;
} & ({ venueId: string } | { venue: { id: string } });

export async function createBooking(body: CreateBookingInput): Promise<Booking> {
  const url = listBookingsUrl();

  // normalize to an id either way
  const id = 'venueId' in body ? body.venueId : body.venue.id;

  const payload = {
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    guests: body.guests,
    venueId: id, // <- required by your backend
    venue: { id }, // <- harmless if ignored, useful on other variants
  };

  const json = await getJSON<{ data: Booking }>(url, {
    method: 'POST',
    headers: buildHeaders('POST'), // now guaranteed Content-Type: application/json
    body: JSON.stringify(payload),
  });
  return json.data;
}

/** Delete a booking (owner/customer can cancel their own) */
export async function deleteBooking(id: string): Promise<void> {
  const url = getBookingByIdUrl(id);
  await getJSON<void>(url, { method: 'DELETE' });
}

// --- “My bookings” helper (for /bookings page) ---

export async function getMyBookings(profileName: string, withVenue = true) {
  const qs = new URLSearchParams();
  if (withVenue) qs.set('_venue', 'true');
  const url = `${API_PROFILES}/${encodeURIComponent(profileName)}/bookings?${qs}`;
  const json = await getJSON<{ data: Booking[] }>(url);
  return json.data;
}

// Small helper you might like in UI
export function isBookingActive(b: BookingBase, now = new Date()) {
  const start = new Date(b.dateFrom).getTime();
  const end = new Date(b.dateTo).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}
