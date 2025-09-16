/** @file countries – normalize messy country inputs to canonical English names. */

import { getNames } from 'country-list';

/** Canonical ISO country names (English) from `country-list`. */
const NAMES: readonly string[] = getNames(); // ["Afghanistan", "Albania", ...]
/** Fast lowercase lookup set for exact matches. */
export const COUNTRY_SET: ReadonlySet<string> = new Set(NAMES.map((n) => n.toLowerCase()));

/**
 * Common aliases & typos → canonical country names.
 * Extend this as you encounter real-world variants.
 */
const ALIASES: Record<string, string> = {
  usa: 'United States',
  'u.s.a.': 'United States',
  us: 'United States',
  'u.k.': 'United Kingdom',
  uk: 'United Kingdom',
  uae: 'United Arab Emirates',
  'south korea': 'Korea, Republic of',
  'north korea': "Korea, Democratic People's Republic of",
  bolivia: 'Bolivia, Plurinational State of',
  tanzania: 'Tanzania, United Republic of',
  'czech republic': 'Czechia',
  brasil: 'Brazil',
  norway: 'Norway',
  norge: 'Norway',
};

/**
 * Loosely normalizes input:
 * - lowercase
 * - strip diacritics
 * - collapse whitespace
 * - trim
 */
function tidy(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // remove accents
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a country string into a canonical English country name.
 *
 * Algorithm:
 * 1) Apply {@link ALIASES} if present.
 * 2) Exact match against `country-list` names (case-insensitive).
 * 3) Garbage guard (too short or contains non-letters/spaces).
 * 4) Heuristic near-match: same first letter + `includes` search among candidates.
 *
 * @param input - Raw country string (may be `null`/`undefined`).
 * @returns Canonical country name (e.g., `"United States"`) or `null` if unrecognized.
 *
 * @example
 * normalizeCountry('  uSa ')      // → "United States"
 * normalizeCountry('Czech Republic') // → "Czechia"
 * normalizeCountry('Norge')       // → "Norway"
 * normalizeCountry('xx')          // → null
 */
export function normalizeCountry(input?: string | null): string | null {
  if (!input) return null;
  const raw = tidy(input);

  // 1) alias table
  if (ALIASES[raw]) return ALIASES[raw];

  // 2) direct match
  if (COUNTRY_SET.has(raw)) {
    const hit = NAMES.find((n) => n.toLowerCase() === raw);
    return hit ?? null;
  }

  // 3) very lenient garbage guard
  if (raw.length < 3 || /[^a-z\s]/i.test(raw)) return null;

  // 4) try first-letter exact & includes for near-misses
  const first = raw[0];
  const candidates = NAMES.filter((n) => n[0].toLowerCase() === first);
  const contains = candidates.find((n) => n.toLowerCase().includes(raw));
  if (contains) return contains;

  return null;
}
