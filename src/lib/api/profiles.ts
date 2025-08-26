// src/lib/api/profiles.ts
import { API_PROFILES, buildHeaders } from '@/lib/api/constants';
import { useAuthStore } from '@/store/authStore';
import type { Media, ProfileLite } from '@/types/common';

type ProfileResponse = {
  data?: {
    venueManager?: boolean;
  };
};

export type UpdateProfileMediaBody = {
  avatar?: Media | null;
  banner?: Media | null;
};

/** Fetches /profiles/:name and updates the store's venueManager flag (best-effort). */
export async function refreshVenueManager(name: string): Promise<boolean | undefined> {
  try {
    const res = await fetch(`${API_PROFILES}/${encodeURIComponent(name)}`, {
      headers: buildHeaders('GET'),
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

export async function setVenueManager(name: string, enabled: boolean): Promise<boolean> {
  const res = await fetch(`${API_PROFILES}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: buildHeaders('PUT'),
    body: JSON.stringify({ venueManager: enabled }),
  });
  if (!res.ok) return false;

  const j = (await res.json().catch(() => ({}))) as ProfileResponse;
  return !!j?.data?.venueManager;
}

export async function updateProfileMedia(
  profileName: string,
  body: UpdateProfileMediaBody,
): Promise<Pick<ProfileLite, 'avatar' | 'banner'>> {
  const res = await fetch(`${API_PROFILES}/${encodeURIComponent(profileName)}`, {
    method: 'PUT',
    headers: buildHeaders('PUT'),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[0]?.message ?? j?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const json = await res.json();
  return json.data;
}
