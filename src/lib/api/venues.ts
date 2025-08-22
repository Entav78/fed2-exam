import type { Media, ProfileLite, VenueLocation, VenueMeta } from '@/types/common';

import {
  API_PROFILES,
  API_VENUES,
  buildHeaders,
  getVenueByIdUrl,
  listVenuesUrl,
} from './constants';

// 👇 canonical booking shape for venues
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
  meta?: VenueMeta;
  location?: VenueLocation;

  // present when you request `_bookings=true`
  bookings?: BookingLite[];

  // present when you request `_owner=true` or `{ owner: true }`
  owner?: ProfileLite;
};

export type VenueInput = {
  name: string;
  description?: string;
  media?: Media[]; // [{ url, alt? }]
  price: number;
  maxGuests: number;
  rating?: number;
  meta?: VenueMeta; // { wifi?, parking?, breakfast?, pets? }
  location?: VenueLocation; // { address?, city?, zip?, country?, continent?, lat?, lng? }
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

// CREATE
export async function createVenue(body: VenueInput) {
  const url = `${API_VENUES}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders('POST'),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.errors?.[0]?.message ?? json?.message ?? 'Create failed');
  return json.data as Venue;
}

// UPDATE
export async function updateVenue(id: string, body: Partial<VenueInput>) {
  const url = `${API_VENUES}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders('PUT'),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.errors?.[0]?.message ?? json?.message ?? 'Update failed');
  return json.data as Venue;
}

// DELETE
export async function deleteVenue(id: string) {
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
