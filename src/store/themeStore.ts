/** @file themeStore – lightweight theme picker persisted in localStorage.
 *
 * Exposes a Zustand store with the current theme and a setter. On first load,
 * the theme is resolved in this order:
 * 1) `<html data-theme="...">` attribute (SSR or hard-coded default)
 * 2) `localStorage["theme"]`
 * 3) fallback `"brown"`
 *
 * The setter updates the `<html>` attribute, persists to localStorage, and
 * updates the store state.
 */

import { create } from 'zustand';

/** Union of all supported theme identifiers. */
export type ThemeId = 'brown' | 'dark' | 'neon' | 'green' | 'green-dark' | 'blue' | 'blue-dark';

/** Allow-list used for validating DOM/localStorage values. */
const ALLOWED: ThemeId[] = ['brown', 'dark', 'neon', 'green', 'green-dark', 'blue', 'blue-dark'];

/**
 * Resolve the initial theme from the DOM or localStorage.
 * @returns A valid {@link ThemeId}, defaulting to `'brown'` if none found.
 */
function initialTheme(): ThemeId {
  const fromDom = document.documentElement.getAttribute('data-theme');
  if (fromDom && (ALLOWED as string[]).includes(fromDom)) return fromDom as ThemeId;

  const saved = localStorage.getItem('theme');
  if (saved && (ALLOWED as string[]).includes(saved)) return saved as ThemeId;

  return 'brown';
}

/**
 * Theme store.
 *
 * - `theme`: current theme id
 * - `setTheme`: updates `<html data-theme>`, persists to localStorage, and updates state
 */
export const useThemeStore = create<{
  /** Currently active theme. */
  theme: ThemeId;
  /**
   * Set a new theme.
   * @param t The theme to apply (must be a valid {@link ThemeId}).
   */
  setTheme: (t: ThemeId) => void;
}>()((set) => ({
  theme: initialTheme(),
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    set({ theme: t });
  },
}));
