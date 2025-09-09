import { create } from 'zustand';

export type ThemeId = 'brown' | 'dark' | 'neon' | 'green' | 'green-dark' | 'blue' | 'blue-dark';

const ALLOWED: ThemeId[] = ['brown', 'dark', 'neon', 'green', 'green-dark', 'blue', 'blue-dark'];

function initialTheme(): ThemeId {
  const fromDom = document.documentElement.getAttribute('data-theme');
  if (fromDom && (ALLOWED as string[]).includes(fromDom)) return fromDom as ThemeId;

  const saved = localStorage.getItem('theme');
  if (saved && (ALLOWED as string[]).includes(saved)) return saved as ThemeId;

  return 'brown';
}

export const useThemeStore = create<{
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}>()((set) => ({
  theme: initialTheme(),
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    set({ theme: t });
  },
}));
