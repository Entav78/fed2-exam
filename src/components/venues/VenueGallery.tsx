/** @file VenueGallery – 16:9 hero image with thumbnail selector, optimized for CLS and LCP. */

import { useMemo, useState } from 'react';

import { useGeocodedStaticMap } from '@/hooks/useGeocodedStaticMap';
import type { Venue } from '@/lib/api/venues';
import { makeSrcSet } from '@/utils/img';
import { optimizeRemoteImage } from '@/utils/optimizeRemoteImage';
import { handleImgErrorToPlaceholder } from '@/utils/venueImage';

type Props = {
  /** Venue fields used for media + fallback map. */
  venue: Pick<Venue, 'id' | 'name' | 'media' | 'location'>;
  /**
   * Make the current hero image high priority on first render
   * (eager, `fetchPriority="high"`, `decoding="sync"`).
   */
  priority?: boolean;
};

/**
 * VenueGallery
 *
 * Displays a 16:9 hero image with optional thumbnails:
 * - If no media is provided, falls back to a geocoded static map (or SVG placeholder).
 * - Uses intrinsic `width/height` + inline `aspect-ratio` to avoid CLS.
 * - Generates responsive `srcSet/sizes` for CDN photos (Unsplash/Pexels) and
 *   applies lightweight CDN params via `optimizeRemoteImage`.
 * - Only the first visible hero image is treated as high priority when `priority` is true.
 */
export default function VenueGallery({ venue, priority = false }: Props) {
  const HERO_W = 1200;
  const HERO_H = 675;
  const HERO_RATIO = HERO_H / HERO_W;

  const { src: geoSrc, alt: geoAlt } = useGeocodedStaticMap(venue, 0, {
    width: HERO_W,
    height: HERO_H,
    zoom: 13,
  });

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

  const isCdnPhoto = /images\.(unsplash|pexels)\.com|unsplash\.com|pexels\.com/i.test(current.url);
  const heroWidths = [360, 480, 640, 768, 960, 1024];
  const heroSrcSet = isCdnPhoto
    ? makeSrcSet(current.url, heroWidths, (w) => Math.round(w * HERO_RATIO))
    : undefined;
  const heroSrc = optimizeRemoteImage(current.url, { width: HERO_W, height: HERO_H });
  const heroSizes = '(min-width: 1024px) 1024px, 100vw';

  const heroPriority = priority && active === 0;

  return (
    <div>
      <div
        className="w-full overflow-hidden rounded-lg bg-border-light"
        style={{ aspectRatio: '16 / 9' }}
      >
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
                    fetchPriority="low"
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
