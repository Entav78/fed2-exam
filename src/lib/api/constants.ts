import { API_BASE, NOROFF_API_KEY } from '@/lib/config';

export { API_BASE }; // re-export if you like

export const API_AUTH = `${API_BASE}/auth`;
export const API_HOLIDAZE = `${API_BASE}/holidaze`;
export const API_VENUES = `${API_HOLIDAZE}/venues`;
export const API_BOOKINGS = `${API_HOLIDAZE}/bookings`;
export const API_PROFILES = `${API_HOLIDAZE}/profiles`;

export function buildHeaders(method: string = 'GET') {
  const headers: Record<string, string> = {};
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    headers['Content-Type'] = 'application/json';
  }
  if (NOROFF_API_KEY) headers['X-Noroff-API-Key'] = NOROFF_API_KEY;

  const token = localStorage.getItem('token') ?? localStorage.getItem('accessToken') ?? undefined;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return headers;
}

/** -------- Venues -------- */

/** List venues with optional query/search/sort/pagination and expansions */
export function listVenuesUrl(params?: {
  q?: string; // free text search
  sort?: string; // e.g. "price" | "rating" | "name"
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  owner?: boolean; // include owner object
  bookings?: boolean; // include bookings array
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.sortOrder) qs.set('sortOrder', params.sortOrder);
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.owner) qs.set('_owner', 'true');
  if (params?.bookings) qs.set('_bookings', 'true');

  const suffix = qs.toString();
  return suffix ? `${API_VENUES}?${suffix}` : API_VENUES;
}

/** Single venue by id (optionally expand owner/bookings) */
export function getVenueByIdUrl(id: string, opts?: { owner?: boolean; bookings?: boolean }) {
  const qs = new URLSearchParams();
  if (opts?.owner) qs.set('_owner', 'true');
  if (opts?.bookings) qs.set('_bookings', 'true');
  const suffix = qs.toString();
  return suffix ? `${API_VENUES}/${id}?${suffix}` : `${API_VENUES}/${id}`;
}

// --- Bookings URL builders ---

/** All bookings, optional expansions + paging/sorting */
export function listBookingsUrl(params?: {
  page?: number;
  limit?: number;
  sort?: 'dateFrom' | 'dateTo' | 'created' | 'updated' | 'guests';
  sortOrder?: 'asc' | 'desc';
  venue?: boolean; // _venue=true (include venue object)
  customer?: boolean; // _customer=true (include customer object)
}) {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.sortOrder) qs.set('sortOrder', params.sortOrder);
  if (params?.venue) qs.set('_venue', 'true');
  if (params?.customer) qs.set('_customer', 'true');
  const suffix = qs.toString();
  return suffix ? `${API_BOOKINGS}?${suffix}` : API_BOOKINGS;
}

/** Single booking by id, with optional expansions */
export function getBookingByIdUrl(id: string, opts?: { venue?: boolean; customer?: boolean }) {
  const qs = new URLSearchParams();
  if (opts?.venue) qs.set('_venue', 'true');
  if (opts?.customer) qs.set('_customer', 'true');
  const suffix = qs.toString();
  return suffix ? `${API_BOOKINGS}/${id}?${suffix}` : `${API_BOOKINGS}/${id}`;
}

/** -------- Profiles (by name) -------- */

export const getProfileUrl = (name: string) => `${API_PROFILES}/${encodeURIComponent(name)}`;

export const getProfileVenuesUrl = (name: string) => `${getProfileUrl(name)}/venues`;

export const getProfileBookingsUrl = (name: string) => `${getProfileUrl(name)}/bookings`;

/** -------- Auth -------- */

export const getRegisterUrl = () => `${API_AUTH}/register`;
export const getLoginUrl = () => `${API_AUTH}/login`;
