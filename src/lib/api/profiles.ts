/** @file profiles – helpers for Holidaze profile endpoints (venueManager flag + media updates). */

// src/lib/api/profiles.ts
import { API_PROFILES, buildHeaders } from '@/lib/api/constants';
import { useAuthStore } from '@/store/authStore';
import type { Media, ProfileLite } from '@/types/common';

type ProfileResponse = {
  data?: {
    venueManager?: boolean;
    avatar?: Media | null;
    banner?: Media | null;
  };
};

/** Body for updating a profile’s media fields. */
export type UpdateProfileMediaBody = {
  /** Optional avatar image (set to `null` to clear). */
  avatar?: Media | null;
  /** Optional banner image (set to `null` to clear). */
  banner?: Media | null;
};

/**
 * Fetch `/profiles/:name` and (best-effort) mirror the `venueManager` flag into the auth store.
 *
 * @param name - Profile name (username).
 * @returns `true`/`false` when the flag is obtained; `undefined` on network/API error.
 *
 * @example
 * const isMgr = await refreshVenueManager('jane.doe'); // may be undefined on failure
 */
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

/**
 * Set the `venueManager` flag for a profile.
 *
 * @param name - Profile name (username).
 * @param enabled - New value for the flag.
 * @returns `true` if the server reports the flag as enabled; otherwise `false`.
 */
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

/**
 * Update a profile’s media (avatar/banner).
 *
 * @param profileName - Profile name (username).
 * @param body - Media updates to apply.
 * @returns The updated `avatar` and `banner` fields from the profile.
 * @throws Error with a message derived from the API response on failure.
 *
 * @example
 * await updateProfileMedia('jane.doe', {
 *   avatar: { url: 'https://…', alt: 'Jane' },
 *   banner: { url: 'https://…', alt: 'Summer trip' },
 * });
 */
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

  const json = (await res.json().catch(() => ({}))) as {
    data?: Partial<Pick<ProfileLite, 'avatar' | 'banner'>>;
  };

  return {
    avatar: json.data?.avatar ?? undefined,
    banner: json.data?.banner ?? undefined,
  };
}
