/** @file ThemeSwitcher – dropdown to switch the app theme (supports header/default styles). */

import { useMemo } from 'react';

import { type ThemeId, useThemeStore } from '@/store/themeStore';

type Props = {
  /** Extra class names for the wrapper label. */
  className?: string;
  /** Visual style for the select: `"default"` (card) or `"header"` (header bar). */
  variant?: 'default' | 'header';
  /** If true, hides the “Theme” text label (icon-only/select-only UI). */
  compact?: boolean;
  /** Callback fired after a theme is chosen. */
  onChanged?: (id: ThemeId) => void;
};

/** Available themes shown in the dropdown. */
const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'brown', label: 'Brown' },
  { id: 'dark', label: 'Dark' },
  { id: 'neon', label: 'Neon' },
  { id: 'green', label: 'Green' },
  { id: 'green-dark', label: 'Green (Dark)' },
  { id: 'blue', label: 'Blue' },
  { id: 'blue-dark', label: 'Blue (Dark)' },
];

/**
 * ThemeSwitcher
 *
 * Controlled select bound to the global theme store. Renders with header-friendly
 * colors when `variant="header"`, or default card styles otherwise.
 * @remarks Invokes `onChanged` after persisting the theme to the store.
 */
export default function ThemeSwitcher({
  className = '',
  variant = 'default',
  compact = false,
  onChanged,
}: Props) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const selectClasses = useMemo(
    () =>
      variant === 'header'
        ? 'rounded px-2 py-1 text-sm bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))] border border-[rgb(var(--header-fg))/30] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--header-fg))/25] appearance-none pr-7'
        : 'rounded px-2 py-1 text-sm bg-card text-fg border border-border focus:outline-none focus:ring-2 focus:ring-border/60 appearance-none pr-7',
    [variant],
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as ThemeId;
    if (!THEMES.some((t) => t.id === val)) return;
    setTheme(val);
    onChanged?.(val);
  }

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      {!compact && <span className="text-sm text-[rgb(var(--header-fg))/0.95]">Theme</span>}
      <div className="relative inline-flex rounded-md hover:shadow-[0_0_0_2px_rgba(255,255,255,.15)] focus-within:ring-2 focus-within:ring-[rgb(var(--header-fg))/25]">
        <select aria-label="Theme" className={selectClasses} value={theme} onChange={handleChange}>
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </div>
    </label>
  );
}
