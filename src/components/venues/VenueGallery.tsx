import { useState } from 'react';

import type { Venue } from '@/lib/api/venues';
import { getVenueImage, handleImgErrorToPlaceholder } from '@/utils/venueImage';

type Props = { venue: Pick<Venue, 'name' | 'media' | 'location'> };

export default function VenueGallery({ venue }: Props) {
  const normalized = (venue.media ?? [])
    .filter((m) => m?.url && m.url.trim())
    .map((m) => ({ url: m!.url!.trim(), alt: m?.alt || venue.name }));

  if (normalized.length === 0) {
    const { src, alt } = getVenueImage(venue, 0, { width: 1200, height: 675, zoom: 13 });
    normalized.push({ url: src, alt });
  }

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
