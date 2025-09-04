import { useMemo, useState } from 'react';

import { useGeocodedStaticMap } from '@/hooks/useGeocodedStaticMap';
import type { Venue } from '@/lib/api/venues';
import { handleImgErrorToPlaceholder } from '@/utils/venueImage';

type Props = { venue: Pick<Venue, 'id' | 'name' | 'media' | 'location'> };

export default function VenueGallery({ venue }: Props) {
  // Geocoded static map (prod only). If geocode fails, this will be your SVG placeholder.
  const { src: geoSrc, alt: geoAlt } = useGeocodedStaticMap(venue, 0, {
    width: 1200,
    height: 675,
    zoom: 13,
  });

  // Normalize media; if none, fall back to the geocoded static map (or SVG if geocode fails)
  const normalized = useMemo(() => {
    const items =
      (venue.media ?? [])
        .filter((m) => m?.url && m.url.trim())
        .map((m) => ({ url: m!.url!.trim(), alt: m?.alt || venue.name })) ?? [];

    if (items.length === 0) {
      items.push({ url: geoSrc, alt: geoAlt });
    }
    return items;
  }, [venue.media, venue.name, geoSrc, geoAlt]);

  const [active, setActive] = useState(0);
  const current = normalized[Math.min(active, normalized.length - 1)];

  return (
    <div>
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-border-light">
        <img
          src={current.url}
          alt={current.alt}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
          onError={handleImgErrorToPlaceholder}
        />
      </div>

      {normalized.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {normalized.map((m, i) => (
            <li key={`${m.url}-${i}`}>
              <button
                onClick={() => setActive(i)}
                className={`h-16 w-24 overflow-hidden rounded border ${
                  i === active ? 'ring-2 ring-brand' : 'border-border-light'
                }`}
                aria-label={`Show image ${i + 1}`}
              >
                <img
                  src={m.url}
                  alt={m.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={handleImgErrorToPlaceholder}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
