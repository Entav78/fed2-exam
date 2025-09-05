// src/lib/config.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://v2.api.noroff.dev';

export const NOROFF_API_KEY = import.meta.env.VITE_API_KEY ?? '';

export const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? '';

export const FORCE_STATIC_MAPS = import.meta.env.VITE_FORCE_STATIC_MAPS === 'true';

// Optional dev-only logging
if (import.meta.env.DEV) {
  console.log('[env] base:', API_BASE, 'geoapify:', Boolean(GEOAPIFY_KEY));
}
