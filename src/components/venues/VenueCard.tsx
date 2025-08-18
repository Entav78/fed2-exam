import { Link } from 'react-router-dom';
import type { Venue } from '@/lib/api/venues';

export default function VenueCard({ venue }: { venue: Venue }) {
  const img = venue.media?.[0]?.url;
  const alt = venue.media?.[0]?.alt || venue.name;

  return (
    <article className="rounded-xl shadow-card bg-white overflow-hidden">
      {img && (
        <img
          src={img}
          alt={alt}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{venue.name}</h3>
        <p className="text-sm text-muted">Max guests: {venue.maxGuests}</p>
        <p className="mt-2 font-bold">{venue.price} NOK / night</p>

        <Link
          to={`/venues/${venue.id}`}
          className="text-brand hover:underline mt-2 inline-block"
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
