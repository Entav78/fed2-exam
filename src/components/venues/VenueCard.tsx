import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { useGeocodedStaticMap } from '@/hooks/useGeocodedStaticMap';
import type { Venue } from '@/lib/api/venues';
import { handleImgErrorToMapThenPlaceholder } from '@/utils/venueImage';

type Props = {
  venue: Venue;
  layout?: 'grid' | 'row';
  showManage?: boolean;
  manageHref?: string;
  className?: string;
  priority?: boolean;
};

const nok = new Intl.NumberFormat('no-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

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

  if (isRow) {
    return (
      <div className={`card min-h-[112px] flex items-center gap-4 ${className ?? ''}`}>
        <img
          src={src}
          alt={alt}
          className={isRow ? 'thumb' : 'h-40 w-full object-cover'}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? ('high' as const) : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          width={imgOpts.width}
          height={imgOpts.height}
          // Tell the browser how wide this image will render at each breakpoint:
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          referrerPolicy="no-referrer"
          onError={handleImgErrorToMapThenPlaceholder(venue, imgOpts)}
        />

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
        src={src}
        alt={alt}
        width={imgOpts.width} // 640
        height={imgOpts.height} // 256
        className="h-40 w-full object-cover"
        loading="lazy"
        decoding="async"
        fetchPriority="auto"
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
