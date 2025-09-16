/** @file constants – base API endpoints and typed URL builders for Holidaze. */

import { API_BASE, NOROFF_API_KEY } from '@/lib/config';

export { API_BASE }; // re-export if you like

/** Root auth endpoint (register/login). */
export const API_AUTH = `${API_BASE}/auth`;
/** Root Holidaze API. */
export const API_HOLIDAZE = `${API_BASE}/holidaze`;
/** Venues collection endpoint. */
export const API_VENUES = `${API_HOLIDAZE}/venues`;
/** Bookings collection endpoint. */
export const API_BOOKINGS = `${API_HOLIDAZE}/bookings`;
/** Profiles collection endpoint. */
export const API_PROFILES = `${API_HOLIDAZE}/profiles`;

/**
 * Build common headers for API requests.
 *
 * - Adds API key header if available.
 * - Adds `Authorization: Bearer <token>` from `localStorage` if present
 *   (`token` or `accessToken`).
 * - For mutating methods (`POST`, `PUT`, `PATCH`), adds `Content-Type: application/json`
 *   when calling `fetch` directly. If you use a helper (e.g., `getJSON`) that already
 *   sets `Content-Type`, pass the default (omit `method`) to avoid duplication.
 *
 * @param method - HTTP method name (default: `"GET"`). Case-insensitive.
 * @returns A plain object suitable for `fetch`’s `headers`.
 */
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

/**
 * Build URL to list venues with optional search/sort/pagination and expansions.
 *
 * @param params - Optional query params.
 * @param params.q - Free text search.
 * @param params.sort - Sort key (e.g. `"price" | "rating" | "name"`).
 * @param params.sortOrder - Sort order (`"asc"` or `"desc"`).
 * @param params.page - Page index (1-based).
 * @param params.limit - Page size.
 * @param params.owner - Include owner object (`_owner=true`).
 * @param params.bookings - Include bookings array (`_bookings=true`).
 * @returns Absolute URL for the venues endpoint with query string.
 */
export function listVenuesUrl(params?: {
  q?: string;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  owner?: boolean;
  bookings?: boolean;
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

/**
 * Build URL for a single venue by id, optionally expanding owner/bookings.
 *
 * @param id - Venue ID.
 * @param opts - Expansion flags.
 * @param opts.owner - Include owner object (`_owner=true`).
 * @param opts.bookings - Include bookings array (`_bookings=true`).
 * @returns Absolute venue URL (with query string when applicable).
 */
export function getVenueByIdUrl(id: string, opts?: { owner?: boolean; bookings?: boolean }) {
  const qs = new URLSearchParams();
  if (opts?.owner) qs.set('_owner', 'true');
  if (opts?.bookings) qs.set('_bookings', 'true');
  const suffix = qs.toString();
  return suffix ? `${API_VENUES}/${id}?${suffix}` : `${API_VENUES}/${id}`;
}

// --- Bookings URL builders ---

/**
 * Build URL to list bookings with optional paging/sorting and expansions.
 *
 * @param params - Optional query params.
 * @param params.page - Page index (1-based).
 * @param params.limit - Page size.
 * @param params.sort - Sort key.
 * @param params.sortOrder - Sort order (`"asc"` | `"desc"`).
 * @param params.venue - Include venue object (`_venue=true`).
 * @param params.customer - Include customer object (`_customer=true`).
 * @returns Absolute bookings URL with query string.
 */
export function listBookingsUrl(params?: {
  page?: number;
  limit?: number;
  sort?: 'dateFrom' | 'dateTo' | 'created' | 'updated' | 'guests';
  sortOrder?: 'asc' | 'desc';
  venue?: boolean;
  customer?: boolean;
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

/**
 * Build URL to a single booking by id with optional expansions.
 *
 * @param id - Booking ID.
 * @param opts - Expansion flags.
 * @param opts.venue - Include venue object (`_venue=true`).
 * @param opts.customer - Include customer object (`_customer=true`).
 * @returns Absolute booking URL (with query string when applicable).
 */
export function getBookingByIdUrl(id: string, opts?: { venue?: boolean; customer?: boolean }) {
  const qs = new URLSearchParams();
  if (opts?.venue) qs.set('_venue', 'true');
  if (opts?.customer) qs.set('_customer', 'true');
  const suffix = qs.toString();
  return suffix ? `${API_BOOKINGS}/${id}?${suffix}` : `${API_BOOKINGS}/${id}`;
}

/** -------- Profiles (by name) -------- */

/** Build URL to a profile by `name`. */
export const getProfileUrl = (name: string) => `${API_PROFILES}/${encodeURIComponent(name)}`;

/** Build URL to a profile’s venues collection. */
export const getProfileVenuesUrl = (name: string) => `${getProfileUrl(name)}/venues`;

/** Build URL to a profile’s bookings collection. */
export const getProfileBookingsUrl = (name: string) => `${getProfileUrl(name)}/bookings`;

/** -------- Auth -------- */

/** Build URL for the register endpoint. */
export const getRegisterUrl = () => `${API_AUTH}/register`;
/** Build URL for the login endpoint. */
export const getLoginUrl = () => `${API_AUTH}/login`;
