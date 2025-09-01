import { Link } from 'react-router-dom';

import type { Venue } from '@/lib/api/venues';

type Props = {
  venue: Venue;
  /** "grid" = card, "row" = compact row with buttons */
  layout?: 'grid' | 'row';
  /** show the Manage button (e.g., on your Profile page) */
  showManage?: boolean;
  /** override manage link if needed; defaults to `/manage/:id` */
  manageHref?: string;
  className?: string;
};

//const price = new Intl.NumberFormat('no-NO').format(venue.price);

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
    // Compact row used in Profile -> My venues
    return (
      <div className={`flex items-center gap-4 card ${className}`}>
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
            NOK {venue.price} / night • Max {venue.maxGuests} guests
          </p>

          {venue.owner?.name && <p className="text-xs text-muted mt-1">Host: {venue.owner.name}</p>}
        </div>

        <div className="flex items-center gap-2">
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

  // Default grid card
  return (
    <article className={`overflow-hidden rounded-xl bg-white shadow-card ${className}`}>
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
        <h3 className="text-lg font-semibold">{venue.name}</h3>
        {city && <p className="text-sm text-muted">{city}</p>}
        <p className="text-sm text-muted">Max guests: {venue.maxGuests}</p>
        <p className="mt-2 font-bold">NOK {venue.price} / night</p>

        {venue.owner?.name && <p className="text-xs text-muted mt-1">Host: {venue.owner.name}</p>}

        <Link to={`/venues/${venue.id}`} className="mt-2 inline-block text-brand hover:underline">
          View details →
        </Link>
      </div>
    </article>
  );
}
