/** @file config – central place for Vite env variables and feature flags. */

/**
 * Base URL for the Noroff API.
 * Read from `VITE_API_BASE_URL`; falls back to the public v2 endpoint.
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://v2.api.noroff.dev';

/**
 * Noroff API key (if provided).
 * Read from `VITE_API_KEY`; empty string when not set.
 */
export const NOROFF_API_KEY = import.meta.env.VITE_API_KEY ?? '';

/**
 * Geoapify API key used for static map tiles.
 * Read from `VITE_GEOAPIFY_KEY`; empty string when not set.
 */
export const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? '';

/**
 * Feature flag: force use of static map images for venues.
 * Read from `VITE_FORCE_STATIC_MAPS`; enabled when value is the string `"true"`.
 */
export const FORCE_STATIC_MAPS = import.meta.env.VITE_FORCE_STATIC_MAPS === 'true';

/* Dev-only visibility into loaded envs (allowed by eslint rule: warn/error only) */
if (import.meta.env.DEV) {
  console.warn('[env]', {
    base: API_BASE,
    geoapify: Boolean(GEOAPIFY_KEY),
    forceStaticMaps: FORCE_STATIC_MAPS,
  });
}
