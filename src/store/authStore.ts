import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Media } from '@/types/common';

type Role = 'visitor' | 'customer' | 'manager';

export type AuthUser = {
  name: string;
  email: string;
  venueManager?: boolean;
  avatarUrl?: string | null;
  avatar?: Media | null;
  banner?: Media | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;

  login: (d: {
    name: string;
    email: string;
    accessToken: string;
    venueManager?: boolean;
    avatarUrl?: string | null;
    avatar?: Media | null; // <-- add
    banner?: Media | null; // <-- add
  }) => void;

  logout: () => void;
  isLoggedIn: () => boolean;
  isManager: () => boolean;
  role: () => Role;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

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

      logout: () => {
        set({ user: null, accessToken: null });
        try {
          localStorage.removeItem('token');
        } catch {
          /* ignore */
        }
      },

      isLoggedIn: () => !!get().accessToken,
      isManager: () => !!get().user?.venueManager,
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
// to the "token" key so buildHeaders() sees it after a reload.
try {
  const t = useAuthStore.getState().accessToken;
  if (t) localStorage.setItem('token', t);
} catch {}
