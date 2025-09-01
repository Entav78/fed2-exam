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

  return (
    <Link
      to={`/venues/${venue.id}`}
      aria-label={`Open ${venue.name}`}
      className={`card h-full flex flex-col transition cursor-pointer
                hover:shadow-lg hover:-translate-y-[1px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50
                group ${className}`}
    >
      {img?.url ? (
        <img
          src={img.url}
          alt={img.alt || venue.name}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-40 w-full bg-muted" />
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold group-hover:underline">{venue.name}</h3>
        {city && <p className="text-sm text-muted">{city}</p>}
        <p className="text-sm text-muted">Max guests: {venue.maxGuests}</p>
        <p className="mt-2 font-bold">NOK {venue.price} / night</p>
        {venue.owner?.name && <p className="text-xs text-muted mt-1">Host: {venue.owner.name}</p>}
        {/* no button/link here */}
      </div>
    </Link>
  );
}
