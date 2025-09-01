import { Link } from 'react-router-dom';

import type { Venue } from '@/lib/api/venues';

type Props = {
  venue: Venue;
  layout?: 'grid' | 'row';
  showManage?: boolean;
  manageHref?: string;
  className?: string;
};

const nok = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' });

export default function VenueCard({
  venue,
  layout = 'grid',
  showManage = false,
  manageHref,
  className = '',
}: Props) {
  const img = venue.media?.[0];
  const city = venue.location?.city;

  if (layout === 'row') {
    return (
      <div className={`card min-h-[112px] flex items-center gap-4 ${className}`}>
        {img?.url ? (
          <img
            src={img.url}
            alt={img.alt || venue.name}
            className="h-16 w-16 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-16 rounded bg-muted" />
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-semibold leading-tight">{venue.name}</p>
          {city && <p className="text-sm text-muted">{city}</p>}
          <p className="mt-1 text-sm">
            {nok.format(venue.price)} / night • Max {venue.maxGuests} guests
          </p>
          {venue.owner?.name && <p className="mt-1 text-xs text-muted">Host: {venue.owner.name}</p>}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Link
            to={`/venues/${venue.id}`}
            className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
          >
            Open
          </Link>
          {showManage && (
            <Link
              to={manageHref ?? `/manage/${venue.id}`}
              className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
            >
              Manage
            </Link>
          )}
        </div>
      </div>
    );
  }

  // inside VenueCard, in the `if (layout === 'row')` branch
  return (
    <div
      className={`card min-h-[112px] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${className}`}
    >
      {img?.url ? (
        <img
          src={img.url}
          alt={img.alt || venue.name}
          className="h-16 w-16 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-16 w-16 rounded bg-muted" />
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-semibold leading-tight">{venue.name}</p>
        {city && <p className="text-sm text-muted">{city}</p>}
        <p className="mt-1 text-sm whitespace-nowrap">
          {/* keep price on a single line */}
          {nok.format(venue.price)} / night • Max {venue.maxGuests} guests
        </p>
        {venue.owner?.name && <p className="mt-1 text-xs text-muted">Host: {venue.owner.name}</p>}
      </div>

      {/* actions: below content on mobile, right-aligned from sm+ */}
      <div className="mt-2 sm:mt-0 sm:ml-auto flex items-center gap-2 shrink-0">
        <Link
          to={`/venues/${venue.id}`}
          className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
        >
          Open
        </Link>
        {showManage && (
          <Link
            to={manageHref ?? `/manage/${venue.id}`}
            className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
          >
            Manage
          </Link>
        )}
      </div>
    </div>
  );
}
