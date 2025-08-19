import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Link, useParams } from 'react-router-dom';

import AmenitiesList from '@/components/venues/AmenitiesList';
import BookingCalendar from '@/components/venues/BookingCalendar';
import VenueGallery from '@/components/venues/VenueGallery';
import VenueMap from '@/components/venues/VenueMap';
import { getVenueById, type Venue } from '@/lib/api/venues';
import { geocodeFromLocation } from '@/lib/geocode';
import { isLikelyValidCoords } from '@/utils/geo';
import { formatLocation } from '@/utils/location';

const nok = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' });

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ✅ All hooks live above any early returns
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackCoords, setFallbackCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  // fetch venue
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

  // (optional) compute nights for price display
  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.max(0, Math.round((+range.to - +range.from) / 86400000));
  }, [range]);

  // geocode fallback: runs when venue changes; bails if coords are valid
  useEffect(() => {
    if (!venue) return;
    const lat = venue.location?.lat;
    const lng = venue.location?.lng;
    if (isLikelyValidCoords(lat, lng)) {
      setFallbackCoords(null);
      return;
    }
    (async () => {
      const gc = await geocodeFromLocation(venue.location);
      if (gc) setFallbackCoords(gc);
    })();
  }, [venue]); // re-run per venue

  // ✅ Now it's safe to early-return — no hooks below this line
  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!venue) return <p className="text-muted">No venue found.</p>;

  const lat = venue.location?.lat;
  const lng = venue.location?.lng;
  const hasCoords = isLikelyValidCoords(lat, lng);
  const locationText = formatLocation(venue.location, 'Location not specified');

  const mapsHref = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : locationText
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`
      : undefined;

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <Link to="/" className="text-brand underline">
        &larr; Back to search
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{venue.name}</h1>
        <p className="text-muted">
          {locationText || 'Location not specified'} • Max guests: {venue.maxGuests}
        </p>
        <p className="text-xl font-semibold">{nok.format(venue.price)} / night</p>
      </header>

      <VenueGallery media={venue.media} name={venue.name} />

      {venue.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p>{venue.description}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Amenities</h2>
        <AmenitiesList meta={venue.meta} />
      </section>

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
        <h2 className="text-lg font-semibold mb-2">Select dates</h2>
        <BookingCalendar
          bookings={(venue.bookings ?? []).map((b) => ({ dateFrom: b.dateFrom, dateTo: b.dateTo }))}
          selected={range}
          onSelect={setRange}
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-muted">
            {nights > 0
              ? `${nights} night${nights === 1 ? '' : 's'}`
              : 'Pick check-in and check-out'}
          </div>
          {nights > 0 && (
            <div className="font-semibold">Total: {nok.format(venue.price * nights)}</div>
          )}
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Location</h2>
        <p className="text-muted mb-3">{locationText}</p>

        {hasCoords ? (
          <VenueMap lat={lat!} lng={lng!} name={venue.name} height={320} />
        ) : fallbackCoords ? (
          <VenueMap
            lat={fallbackCoords.lat}
            lng={fallbackCoords.lng}
            name={venue.name}
            height={320}
          />
        ) : (
          <p className="text-sm text-muted">No valid map location for this venue.</p>
        )}

        {mapsHref && locationText && locationText.trim().length > 2 && (
          <a
            className="mt-2 inline-block underline text-brand"
            target="_blank"
            rel="noopener noreferrer"
            href={mapsHref}
          >
            Open in Maps ↗
          </a>
        )}
      </section>

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
