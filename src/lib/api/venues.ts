import { buildHeaders, listVenuesUrl, getVenueByIdUrl } from './constants';

/** Minimal Venue-type – utvid etter behov på vei videre */
export type Media = { url: string; alt?: string };
export type Venue = {
  id: string;
  name: string;
  description?: string;
  media: Media[];
  price: number;
  maxGuests: number;
  rating?: number;
  meta?: {
    wifi?: boolean;
    parking?: boolean;
    breakfast?: boolean;
    pets?: boolean;
  };
};

/** Liten helper for å redusere duplisering */
async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: buildHeaders(), ...init });
  if (!res.ok) {
    // prøv å hente feilmelding fra API-et
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/**
 * Henter alle venues (med opsjoner for søk/sort/paginering/expansions).
 * @example fetchVenues({ q: "oslo", sort: "price", sortOrder: "asc", page: 1, limit: 20, owner: true })
 */
export async function fetchVenues(params?: {
  q?: string;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  owner?: boolean; // _owner=true
  bookings?: boolean; // _bookings=true
}): Promise<Venue[]> {
  const url = listVenuesUrl(params);
  const json = await getJSON<{ data: Venue[] }>(url);
  return json.data;
}

/**
 * Henter én venue etter id (valgfritt å inkludere owner/bookings).
 * @example getVenueById("abc123", { bookings: true })
 */
export async function getVenueById(
  id: string,
  opts?: { owner?: boolean; bookings?: boolean }
): Promise<Venue> {
  const url = getVenueByIdUrl(id, opts);
  const json = await getJSON<{ data: Venue }>(url);
  return json.data;
}
