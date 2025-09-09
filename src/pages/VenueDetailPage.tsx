import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import AmenitiesList from '@/components/venues/AmenitiesList';
import BookingCalendar from '@/components/venues/BookingCalendar';
import VenueGallery from '@/components/venues/VenueGallery';
import VenueMap from '@/components/venues/VenueMap';
import { createBooking } from '@/lib/api/bookings';
import type { BookingLite } from '@/lib/api/venues';
import { getVenueById, type Venue } from '@/lib/api/venues';
import { geocodeAddress, type GeocodeHit } from '@/lib/geocode';
import { useAuthStore } from '@/store/authStore';
import { dateOnly } from '@/utils/date';
import { isLikelyValidCoords } from '@/utils/geo';
import { formatLocation } from '@/utils/location';

const nok = new Intl.NumberFormat('no-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ✅ All hooks live above any early returns
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackCoords, setFallbackCoords] = useState<GeocodeHit | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const loggedIn = useAuthStore((s) => s.isLoggedIn());
  const currentUser = useAuthStore((s) => s.user);
  const [guests, setGuests] = useState(1);
  const [bookingBusy, setBookingBusy] = useState(false);

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

  const venueId = venue?.id ?? '';
  const venueName = venue?.name ?? '';
  const addr = venue?.location?.address ?? '';
  const city = venue?.location?.city ?? '';
  const country = venue?.location?.country ?? '';
  const latVal = venue?.location?.lat;
  const lngVal = venue?.location?.lng;
  const hasStoredCoords = isLikelyValidCoords(latVal, lngVal);

  useEffect(() => {
    if (!venueId) return;

    if (hasStoredCoords) {
      setFallbackCoords(null);
      return;
    }

    let active = true;
    (async () => {
      const tries: string[] = [];

      const structured = [addr, city, country].filter(Boolean).join(', ');
      if (structured) tries.push(structured);

      const formatted = [city, country].filter(Boolean).join(', ');
      if (formatted && formatted !== structured) tries.push(formatted);

      if (venueName) {
        tries.push(formatted ? `${venueName}, ${formatted}` : venueName);
      }

      for (const q of [...new Set(tries)]) {
        const hit = await geocodeAddress(q);
        if (!active) return;
        if (hit) {
          setFallbackCoords(hit);
          return;
        }
      }

      if (active) setFallbackCoords(null);
    })();

    return () => {
      active = false;
    };
  }, [venueId, venueName, addr, city, country, hasStoredCoords]);

  // re-run per venue

  // ✅ Now it's safe to early-return — no hooks below this line
  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!venue) return <p className="text-muted">No venue found.</p>;

  const lat = venue.location?.lat;
  const lng = venue.location?.lng;
  const hasCoords = isLikelyValidCoords(lat, lng);

  // prefer real coords; otherwise use the geocoded fallback (with label)
  const coords = hasCoords ? { lat: Number(lat), lng: Number(lng) } : fallbackCoords;

  const locationText = coords?.label ?? formatLocation(venue.location, 'Location not specified');

  const mapsHref = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : locationText
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`
      : undefined;

  async function handleBook() {
    if (!venue) return;
    if (!loggedIn) return toast.error('Please log in to book');
    if (!range?.from || !range?.to) return toast.error('Pick check-in and check-out');

    const g = Number.isFinite(guests) ? guests : 1;
    if (g < 1 || g > venue.maxGuests) {
      return toast.error(`Guests must be between 1 and ${venue.maxGuests}`);
    }
    // prevent booking your own venue
    if (currentUser?.name && venue.owner?.name && currentUser.name === venue.owner.name) {
      return toast.error("You can't book your own venue");
    }

    setBookingBusy(true);
    try {
      const newBooking = await createBooking({
        dateFrom: dateOnly(range.from),
        dateTo: dateOnly(range.to),
        guests: g,
        venue: { id: venue.id },
      });

      const lite: BookingLite = {
        id: newBooking.id,
        dateFrom: newBooking.dateFrom,
        dateTo: newBooking.dateTo,
        guests: newBooking.guests,
      };

      setVenue((v) => (v ? { ...v, bookings: [...(v.bookings ?? []), lite] } : v));

      setRange(undefined);
      toast.success('Booking confirmed!');
      // optional: navigate('/bookings');
    } catch (e) {
      console.error('Booking failed:', e);
      toast.error(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBookingBusy(false);
    }
  }

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

      <VenueGallery venue={venue} />

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

      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm">
          Guests
          <input
            type="number"
            min={1}
            max={venue.maxGuests}
            value={guests}
            onChange={(e) =>
              setGuests(Math.max(1, Math.min(venue.maxGuests, Number(e.target.value) || 1)))
            }
            className="ml-2 w-20 input-field"
          />
          <span className="ml-2 opacity-70">/ max {venue.maxGuests}</span>
        </label>

        <Button
          onClick={handleBook}
          disabled={!loggedIn || bookingBusy || !range?.from || !range?.to}
          isLoading={bookingBusy}
          className="ml-auto"
          variant="form"
        >
          Book this venue
        </Button>
      </div>

      {/* Location */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Location</h2>
        <p className="text-muted mb-3">{locationText}</p>

        {coords ? (
          <VenueMap lat={coords.lat} lng={coords.lng} name={venue.name} height={320} />
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
          className="rounded border border-border-light px-4 py-2"
          onClick={() => window.history.back()}
        >
          Go back
        </button>
      </div>
    </article>
  );
}
