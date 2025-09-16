/** @file VenueCard – venue preview card for grid and row layouts with responsive, optimized images. */

import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { useGeocodedStaticMap } from '@/hooks/useGeocodedStaticMap';
import type { Venue } from '@/lib/api/venues';
import { makeSrcSet } from '@/utils/img';
import { optimizeRemoteImage } from '@/utils/optimizeRemoteImage';
import { handleImgErrorToMapThenPlaceholder } from '@/utils/venueImage';

/** Intrinsic thumb size for the row layout (px). */
const ROW_W = 96;
const ROW_H = 64;

/** Props for {@link VenueCard}. */
type Props = {
  /** Venue data to render. */
  venue: Venue;
  /** Layout style: `"grid"` (default) or `"row"`. */
  layout?: 'grid' | 'row';
  /** Whether to show the Manage button (manager view). */
  showManage?: boolean;
  /** Custom href for Manage (defaults to `/manage/:id`). */
  manageHref?: string;
  /** Extra class names for the root card. */
  className?: string;
  /**
   * If true, mark the image as high priority (eager + fetchPriority=high).
   * Useful for the first card in a list or LCP candidates.
   */
  priority?: boolean;
};

/** NOK currency formatter (no decimals). */
const nok = new Intl.NumberFormat('no-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * VenueCard
 *
 * Renders a venue in either:
 * - **grid**: big image, stacked details
 * - **row**: compact thumbnail + inline details + actions
 *
 * @remarks
 * - Images: row uses a fixed 96×64 thumb (prevents CLS); grid uses responsive `sizes/srcSet`.
 * - `optimizeRemoteImage` adds CDN params (e.g., Unsplash/Pexels) for smaller payloads.
 * - If the venue photo fails, it falls back to a static map, then a placeholder.
 */
export default function VenueCard({
  venue,
  layout = 'grid',
  showManage = false,
  manageHref,
  className = '',
  priority = false,
}: Props) {
  const isRow = layout === 'row';
  const city = venue.location?.city;

  const imgOpts = isRow
    ? { width: 128, height: 128, zoom: 14 }
    : { width: 640, height: 256, zoom: 13 };

  const { src, alt } = useGeocodedStaticMap(venue, 0, imgOpts);

  const ratio = imgOpts.height / imgOpts.width; // 256/640 = 0.4 in grid, 1 in row
  const widths = isRow ? [128, 192, 256] : [320, 360, 420, 480, 640, 768, 960];

  // sizes tell the browser how wide it *renders*
  const sizes = isRow
    ? '128px' // fixed avatar/thumb in the row layout
    : '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw';

  // only build a srcSet for real photos (maps/placeholder can keep normal src)
  const isCdnPhoto = /images\.(unsplash|pexels)\.com|unsplash\.com|pexels\.com/i.test(src);
  const srcSet = isCdnPhoto ? makeSrcSet(src, widths, (w) => Math.round(w * ratio)) : undefined;

  const srcOptimized = optimizeRemoteImage(src, {
    width: imgOpts.width,
    height: imgOpts.height,
  });

  if (isRow) {
    return (
      <div className={`card min-h-[112px] flex items-center gap-4 ${className ?? ''}`}>
        <div className="h-16 w-24 overflow-hidden rounded border border-border shrink-0">
          <img
            src={srcOptimized}
            alt={alt}
            width={ROW_W}
            height={ROW_H}
            className="h-full w-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? ('high' as const) : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            sizes="96px"
            {...(srcSet ? { srcSet } : {})}
            referrerPolicy="no-referrer"
            onError={handleImgErrorToMapThenPlaceholder(venue, {
              width: ROW_W,
              height: ROW_H,
              zoom: 14,
            })}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-semibold leading-tight">{venue.name}</p>
          {city && <p className="text-sm text-muted">{city}</p>}
          <p className="mt-1 text-sm">
            {nok.format(venue.price)} / night • Max {venue.maxGuests} guests
          </p>
          {venue.owner?.name && <p className="mt-1 text-xs text-muted">Host: {venue.owner.name}</p>}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Link to={`/venues/${venue.id}`}>
            <Button variant="outline" size="sm" type="button">
              Open
            </Button>
          </Link>
          {showManage && (
            <Link to={manageHref ?? `/manage/${venue.id}`}>
              <Button variant="outline" size="sm" type="button">
                Manage
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // grid
  return (
    <Link
      to={`/venues/${venue.id}`}
      aria-label={`Open ${venue.name}`}
      className={`card h-full flex flex-col transition cursor-pointer
                  hover:shadow-lg hover:-translate-y-[1px]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50
                  group ${className}`}
    >
      <img
        src={srcOptimized}
        alt={alt}
        width={imgOpts.width}
        height={imgOpts.height}
        className="h-40 w-full object-cover"
        sizes={sizes}
        {...(srcSet ? { srcSet } : {})}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? ('high' as const) : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        referrerPolicy="no-referrer"
        onError={handleImgErrorToMapThenPlaceholder(venue, imgOpts)}
      />

      <div className="p-4">
        <h2 className="text-lg font-semibold group-hover:underline">{venue.name}</h2>
        {city && <p className="text-sm text-muted">{city}</p>}
        <p className="text-sm text-muted">Max guests: {venue.maxGuests}</p>
        <p className="mt-2 font-bold">{nok.format(venue.price)} / night</p>
        {venue.owner?.name && <p className="text-xs text-muted mt-1">Host: {venue.owner.name}</p>}
      </div>
    </Link>
  );
}
