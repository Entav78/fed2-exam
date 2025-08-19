import { buildHeaders, getVenueByIdUrl, listVenuesUrl } from './constants';

// if not already present:
export type Media = { url: string; alt?: string };

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

export type BookingLite = {
  id: string;
  dateFrom: string; // ISO
  dateTo: string; // ISO
  guests: number;
};

export type Venue = {
  id: string;
  name: string;
  description?: string;
  media: Media[];
  price: number;
  maxGuests: number;
  rating?: number;

  // ✅ add these:
  meta?: VenueMeta;
  location?: VenueLocation;

  // present when you request `_bookings=true`
  bookings?: BookingLite[];
};

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

export async function fetchVenues(params?: {
  q?: string;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  owner?: boolean;
  bookings?: boolean; // <— ask for bookings so we can filter availability
}): Promise<Venue[]> {
  const url = listVenuesUrl(params);
  const json = await getJSON<{ data: Venue[] }>(url);
  return json.data;
}

export async function getVenueById(
  id: string,
  opts?: { owner?: boolean; bookings?: boolean },
): Promise<Venue> {
  const url = getVenueByIdUrl(id, opts);
  const json = await getJSON<{ data: Venue }>(url);
  return json.data;
}

/** Availability: true if guests fit and the date range doesn't overlap any booking. */
export function isVenueAvailable(venue: Venue, fromISO: string, toISO: string, guests: number) {
  if (!fromISO || !toISO) return false;
  if (guests > venue.maxGuests) return false;

  const start = Date.parse(fromISO);
  const end = Date.parse(toISO);

  // Treat dateTo as "checkout" (exclusive). Overlap rule: a<bEnd && bStart<end
  const overlaps = (venue.bookings ?? []).some((b) => {
    const bStart = Date.parse(b.dateFrom);
    const bEnd = Date.parse(b.dateTo);
    return start < bEnd && bStart < end;
  });

  return !overlaps;
}
