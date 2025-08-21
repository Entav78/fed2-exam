// src/lib/api/profiles.ts
import { API_PROFILES, buildHeaders } from '@/lib/api/constants';
import { useAuthStore } from '@/store/authStore';

type ProfileResponse = {
  data?: {
    venueManager?: boolean;
  };
};

/** Fetches /profiles/:name and updates the store's venueManager flag (best-effort). */
export async function refreshVenueManager(
  name: string,
  token?: string,
): Promise<boolean | undefined> {
  try {
    const res = await fetch(`${API_PROFILES}/${encodeURIComponent(name)}`, {
      headers: buildHeaders(token),
    });
    if (!res.ok) return undefined;

    let json: ProfileResponse | null = null;
    try {
      json = (await res.json()) as ProfileResponse;
    } catch {}
    const flag = typeof json?.data?.venueManager === 'boolean' ? json.data.venueManager : undefined;

    if (typeof flag === 'boolean') {
      useAuthStore.setState((s) => (s.user ? { user: { ...s.user, venueManager: flag } } : s));
    }
    return flag;
  } catch {
    return undefined;
  }
}

export async function setVenueManager(
  name: string,
  enabled: boolean,
  token: string,
): Promise<boolean> {
  const res = await fetch(`${API_PROFILES}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify({ venueManager: enabled }),
  });
  if (!res.ok) return false;

  const j = (await res.json().catch(() => ({}))) as ProfileResponse;
  return !!j?.data?.venueManager;
}
