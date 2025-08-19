import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import AmenitiesList from '@/components/venues/AmenitiesList';
import VenueGallery from '@/components/venues/VenueGallery';
import VenueMap from '@/components/venues/VenueMap';
import { getVenueById, type Venue } from '@/lib/api/venues';
import { isLikelyValidCoords } from '@/utils/geo';
import { formatLocation } from '@/utils/location';

const nok = new Intl.NumberFormat('no-NO', {
  style: 'currency',
  currency: 'NOK',
});

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const v = await getVenueById(id, { owner: true, bookings: true });
        setVenue(v);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const locationText = formatLocation(venue?.location, 'Location not specified');

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!venue) return <p className="text-muted">No venue found.</p>;

  const lat = venue.location?.lat;
  const lng = venue.location?.lng;
  const hasCoords = isLikelyValidCoords(lat, lng);

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <Link to="/" className="text-brand underline">
        &larr; Back to search
      </Link>

      {/* Title + quick facts */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{venue.name}</h1>
        <p className="text-muted">
          {locationText || 'Location not specified'} • Max guests: {venue.maxGuests}
        </p>
        <p className="text-xl font-semibold">{nok.format(venue.price)} / night</p>
      </header>

      {/* Gallery */}
      <VenueGallery media={venue.media} name={venue.name} />

      {/* Description */}
      {venue.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p>{venue.description}</p>
        </section>
      )}

      {/* Amenities */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Amenities</h2>
        <AmenitiesList meta={venue.meta} />
      </section>

      {/* Booked dates */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Booked dates</h2>
        {venue.bookings?.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {venue.bookings.map((b) => (
              <li key={b.id} className="rounded border border-border-light p-2 text-sm bg-card">
                {new Date(b.dateFrom).toLocaleDateString()} →{' '}
                {new Date(b.dateTo).toLocaleDateString()}
                <span className="opacity-70"> • guests {b.guests}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-sm">No bookings yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Location</h2>
        <p className="text-muted mb-3">
          {formatLocation(venue.location, 'Location not specified')}
        </p>

        {hasCoords ? (
          <VenueMap lat={lat!} lng={lng!} name={venue.name} height={320} />
        ) : (
          <p className="text-sm text-muted">No valid map location for this venue.</p>
        )}
      </section>

      {/* CTA (stub) */}
      <div className="flex gap-3">
        <button
          className="rounded bg-brand px-4 py-2 text-white"
          onClick={() => alert('Booking flow coming next ✨')}
        >
          Book this venue
        </button>
        <button
          className="rounded border border-border-light px-4 py-2"
          onClick={() => window.history.back()}
        >
          Go back
        </button>
      </div>
    </article>
  );
}
