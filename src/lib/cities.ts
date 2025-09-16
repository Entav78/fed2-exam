/** @file cities – utilities to normalize messy city names into a consistent, title-cased form. */

/**
 * Normalize a string to a loose, ASCII-like token:
 * - lowercases
 * - Unicode NFD + remove diacritics (`\p{Diacritic}`)
 * - collapses internal whitespace
 * - trims ends
 *
 * @param s - Raw input string.
 * @returns A tidy, lowercased string without diacritics.
 */
function tidy(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Title-case each space- and hyphen-separated segment.
 * Keeps original hyphens and single spaces between words.
 *
 * @param s - A tidy string (typically the result of {@link tidy}).
 * @returns Title-cased city string (e.g., "rio-de-janeiro" → "Rio-De-Janeiro").
 */
function titleCaseCity(s: string) {
  return s
    .split(' ')
    .map((part) =>
      part
        .split('-')
        .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
        .join('-'),
    )
    .join(' ');
}

/**
 * Canonical replacements for common typos / variants seen in data.
 * Extend this map as you discover more real-world aliases.
 */
const CITY_ALIASES: Record<string, string> = {
  // Oslo
  oslo: 'Oslo',
  olso: 'Oslo',
  'o s l o': 'Oslo',
  // Stavanger
  stavanger: 'Stavanger',
  stavenger: 'Stavanger',
  stavannger: 'Stavanger',

  'namsos rock city': 'Namsos',
  loften: 'Lofoten',
  lofoten: 'Lofoten',
  hemsedal: 'Hemsedal',
};

/**
 * Very loose junk detector fragments.
 * If a tidy input contains any of these, it's treated as invalid.
 */
const BAD_FRAGMENTS = ['test', 'asdf', 'qwer', 'whatever', 'place', 'city', 'n/a', 'none'];

/**
 * Normalize an optional city name into a cleaned, canonical form.
 *
 * Steps:
 * 1. `tidy` → lowercase, strip diacritics, collapse spaces.
 * 2. Reject obvious junk (too short, digits only, contains bad fragments).
 * 3. Apply alias mapping (e.g., "olso" → "Oslo").
 * 4. Reject if non-letters other than space/hyphen remain.
 * 5. Title-case words and hyphenated parts.
 *
 * @param input - Raw city text (may be `null`/`undefined`).
 * @returns Canonical city (e.g., `"Stavanger"`) or `null` if invalid/unknown.
 *
 * @example
 * normalizeCity(' olsó ')         // → "Oslo"
 * normalizeCity('rio-de-janeiro') // → "Rio-De-Janeiro"
 * normalizeCity('12345')          // → null
 */
export function normalizeCity(input?: string | null): string | null {
  if (!input) return null;
  const raw = tidy(input);

  // obvious junk
  if (raw.length < 2) return null;
  if (/^\d+$/.test(raw)) return null;
  if (BAD_FRAGMENTS.some((w) => raw.includes(w))) return null;

  // aliases first
  if (CITY_ALIASES[raw]) return CITY_ALIASES[raw];

  // Only letters/space/hyphen after tidy; reject noisy values
  if (/[^a-z\- ]/.test(raw)) return null;

  return titleCaseCity(raw);
}
