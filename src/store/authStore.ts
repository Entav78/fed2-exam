/** @file authStore – persisted auth/session state (Zustand).
 *
 * Persists the authenticated user, access token, and a few helpers for role
 * checks. Mirrors the token to `localStorage` (key: `"token"`) so your API
 * helpers can read it on page reloads.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Media } from '@/types/common';

/** Role buckets derived from auth state. */
type Role = 'visitor' | 'customer' | 'manager';

/**
 * Minimal user profile kept in auth state.
 * Use the richer `Media` objects for the profile editor; `avatarUrl` is a
 * convenience URL for lightweight UI (e.g., header).
 */
export type AuthUser = {
  /** Display name (also used as profile key in the API). */
  name: string;
  /** Primary email. */
  email: string;
  /** NOROFF “venue manager” flag from the API. */
  venueManager?: boolean;
  /** Quick URL for header/avatar, falls back to `avatar.url`. */
  avatarUrl?: string | null;
  /** Full avatar media object (nullable). */
  avatar?: Media | null;
  /** Optional banner/cover media object (nullable). */
  banner?: Media | null;
};

/**
 * Shape of the Zustand auth store.
 *
 * Includes imperative actions (`login`, `logout`) and convenience selectors
 * (`isLoggedIn`, `isManager`, `role`) which do not mutate state.
 */
type AuthState = {
  /** The authenticated user (or `null` if logged out). */
  user: AuthUser | null;
  /** Bearer token used for API calls (or `null` if logged out). */
  accessToken: string | null;

  /**
   * Store the authenticated session and user.
   * Also mirrors the `accessToken` to `localStorage` under the `"token"` key.
   */
  login: (d: {
    name: string;
    email: string;
    accessToken: string;
    venueManager?: boolean;
    avatarUrl?: string | null;
    avatar?: Media | null; // <-- add
    banner?: Media | null; // <-- add
  }) => void;

  /** Clear user and token from state and `localStorage`. */
  logout: () => void;

  /** `true` when a non-empty access token exists. */
  isLoggedIn: () => boolean;

  /** `true` when the current user has the venue-manager flag. */
  isManager: () => boolean;

  /**
   * Coarse role derived from state:
   * - `"visitor"`: no token
   * - `"manager"`: logged in with `venueManager=true`
   * - `"customer"`: logged in without manager flag
   */
  role: () => Role;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      /** See {@link AuthState.login}. */
      login: ({ name, email, accessToken, venueManager, avatarUrl, avatar, banner }) => {
        set({
          user: {
            name,
            email,
            venueManager,
            // simple URL used by header/UI
            avatarUrl: avatarUrl ?? avatar?.url ?? null,
            // full objects for editor/profile
            avatar: avatar ?? null,
            banner: banner ?? null,
          },
          accessToken,
        });
        try {
          localStorage.setItem('token', accessToken);
        } catch {}
      },

      /** See {@link AuthState.logout}. */
      logout: () => {
        set({ user: null, accessToken: null });
        try {
          localStorage.removeItem('token');
        } catch {
          /* ignore */
        }
      },

      /** See {@link AuthState.isLoggedIn}. */
      isLoggedIn: () => !!get().accessToken,

      /** See {@link AuthState.isManager}. */
      isManager: () => !!get().user?.venueManager,

      /** See {@link AuthState.role}. */
      role: () => {
        const s = get();
        if (!s.accessToken) return 'visitor';
        return s.user?.venueManager ? 'manager' : 'customer';
      },
    }),
    { name: 'auth-storage' },
  ),
);

// On first import, if there’s already a token in the persisted store, mirror it
// to the "token" key so API helpers (e.g., buildHeaders) see it after reload.
try {
  const t = useAuthStore.getState().accessToken;
  if (t) localStorage.setItem('token', t);
} catch {}
