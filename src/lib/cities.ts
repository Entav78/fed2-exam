function tidy(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

// Optional global aliases (add your own as you see them in data)
const CITY_ALIASES: Record<string, string> = {
  // typos / weird capitalizations → canonical
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

// very loose junk detector (short, digits-only, lorem, “whatever”, etc.)
const BAD_FRAGMENTS = ['test', 'asdf', 'qwer', 'whatever', 'place', 'city', 'n/a', 'none'];

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
