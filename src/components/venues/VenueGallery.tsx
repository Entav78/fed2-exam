import { useMemo, useState } from 'react';

import { useGeocodedStaticMap } from '@/hooks/useGeocodedStaticMap';
import type { Venue } from '@/lib/api/venues';
import { makeSrcSet } from '@/utils/img';
import { optimizeRemoteImage } from '@/utils/optimizeRemoteImage';
import { handleImgErrorToPlaceholder } from '@/utils/venueImage';

type Props = {
  venue: Pick<Venue, 'id' | 'name' | 'media' | 'location'>;
  /** Make the *current* hero image high priority (used on first render) */
  priority?: boolean;
};

export default function VenueGallery({ venue, priority = false }: Props) {
  // 16:9 hero
  const HERO_W = 1200;
  const HERO_H = 675;
  const HERO_RATIO = HERO_H / HERO_W;

  // Geocoded static map (prod only). If geocode fails, this becomes SVG placeholder.
  const { src: geoSrc, alt: geoAlt } = useGeocodedStaticMap(venue, 0, {
    width: HERO_W,
    height: HERO_H,
    zoom: 13,
  });

  // Normalize media; if none, fall back to the geocoded static map (or SVG if geocode fails)
  const normalized = useMemo(() => {
    const items =
      (venue.media ?? [])
        .filter((m) => m?.url && m.url.trim())
        .map((m) => ({ url: m!.url!.trim(), alt: m?.alt || venue.name })) ?? [];

    if (items.length === 0) items.push({ url: geoSrc, alt: geoAlt });
    return items;
  }, [venue.media, venue.name, geoSrc, geoAlt]);

  const [active, setActive] = useState(0);
  const current = normalized[Math.min(active, normalized.length - 1)];

  // 🧠 Responsive hero image bits
  const isCdnPhoto = /images\.(unsplash|pexels)\.com|unsplash\.com|pexels\.com/i.test(current.url);
  const heroWidths = [480, 640, 768, 960, 1200];
  const heroSrcSet = isCdnPhoto
    ? makeSrcSet(current.url, heroWidths, (w) => Math.round(w * HERO_RATIO))
    : undefined;
  const heroSrc = optimizeRemoteImage(current.url, { width: HERO_W, height: HERO_H });
  const heroSizes = '100vw'; // it fills the container width
  const heroPriority = priority && active === 0; // only the first visible hero gets eager/high

  return (
    <div>
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-border-light">
        <img
          src={heroSrc}
          alt={current.alt}
          width={HERO_W}
          height={HERO_H}
          className="h-full w-full object-cover"
          sizes={heroSizes}
          {...(heroSrcSet ? { srcSet: heroSrcSet } : {})}
          loading={heroPriority ? 'eager' : 'lazy'}
          fetchPriority={heroPriority ? ('high' as const) : 'auto'}
          decoding={heroPriority ? 'sync' : 'async'}
          onError={handleImgErrorToPlaceholder}
        />
      </div>

      {normalized.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto" role="list">
          {normalized.map((m, i) => {
            const TH_W = 192;
            const TH_H = 108;
            const thumbSrc = optimizeRemoteImage(m.url, { width: TH_W, height: TH_H });

            return (
              <li key={`${m.url}-${i}`}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-16 w-24 overflow-hidden rounded border ${
                    i === active ? 'ring-2 ring-brand' : 'border-border'
                  }`}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === active ? 'true' : undefined}
                >
                  <img
                    src={thumbSrc}
                    alt={m.alt}
                    width={TH_W}
                    height={TH_H}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={handleImgErrorToPlaceholder}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
