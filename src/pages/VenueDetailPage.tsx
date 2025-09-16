/** @file VenueDetailPage – full venue details, gallery, availability picker, and booking CTA. */

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import AmenitiesList from '@/components/venues/AmenitiesList';
import BookingCalendar from '@/components/venues/BookingCalendar';
import VenueGallery from '@/components/venues/VenueGallery';
import { createBooking } from '@/lib/api/bookings';
import type { BookingLite } from '@/lib/api/venues';
import { getVenueById, type Venue } from '@/lib/api/venues';
import { geocodeAddress, type GeocodeHit } from '@/lib/geocode';
import { useAuthStore } from '@/store/authStore';
import { dateOnly } from '@/utils/date';
import { isLikelyValidCoords } from '@/utils/geo';
import { formatLocation } from '@/utils/location';

const VenueMap = lazy(() => import('@/components/venues/VenueMap'));

const nok = new Intl.NumberFormat('no-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * VenueDetailPage
 *
 * Loads a single venue (owner + bookings), shows media, amenities, a date-range
 * calendar that respects existing bookings, and a guarded booking CTA.
 * Also tries geocoding if coordinates are missing to provide a fallback map pin.
 */
export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();

  // --- state & session ---
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackCoords, setFallbackCoords] = useState<GeocodeHit | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const loggedIn = useAuthStore((s) => s.isLoggedIn());
  const currentUser = useAuthStore((s) => s.user);
  const [guests, setGuests] = useState(1);
  const [bookingBusy, setBookingBusy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const missingDates = !range?.from || !range?.to;

  // --- load venue ---
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

  // --- price nights (simple ms diff; swap to differenceInCalendarDays if you prefer) ---
  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.max(0, Math.round((+range.to - +range.from) / 86400000));
  }, [range]);

  // --- map coords / geocode fallback ---
  const latVal = venue?.location?.lat;
  const lngVal = venue?.location?.lng;
  const hasStoredCoords = isLikelyValidCoords(latVal, lngVal);

  useEffect(() => {
    if (!venue?.id) return;
    if (hasStoredCoords) {
      setFallbackCoords(null);
      return;
    }

    let active = true;
    (async () => {
      const tries = [
        [venue.location?.address, venue.location?.city, venue.location?.country]
          .filter(Boolean)
          .join(', '),
        [venue.location?.city, venue.location?.country].filter(Boolean).join(', '),
        venue.name &&
          [venue.name, venue.location?.city, venue.location?.country].filter(Boolean).join(', '),
      ].filter(Boolean) as string[];

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
  }, [
    venue?.id,
    hasStoredCoords,
    venue?.name,
    venue?.location?.address,
    venue?.location?.city,
    venue?.location?.country,
  ]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!venue) return <p className="text-muted">No venue found.</p>;

  const hasCoords = isLikelyValidCoords(venue.location?.lat, venue.location?.lng);
  const coords = hasCoords
    ? { lat: Number(venue.location!.lat), lng: Number(venue.location!.lng) }
    : fallbackCoords || undefined;

  const locationText = coords?.label ?? formatLocation(venue.location, 'Location not specified');
  const mapsHref = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : locationText
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`
      : undefined;

  const isOwner = !!(
    currentUser?.name &&
    venue.owner?.name &&
    currentUser.name === venue.owner.name
  );
  const ctaDisabled = bookingBusy || missingDates || isOwner;

  /**
   * Attempt to create a booking with current inputs.
   * Validates auth, date range, guests, and prevents booking own venue.
   */
  async function handleBook() {
    if (!venue) return;
    if (!loggedIn) return toast.error('Please log in to book');
    if (!range?.from || !range?.to) return toast.error('Pick check-in and check-out');
    if (isOwner) return toast.error("You can't book your own venue");

    const g = Number.isFinite(guests) ? guests : 1;
    if (g < 1 || g > venue.maxGuests) {
      return toast.error(`Guests must be between 1 and ${venue.maxGuests}`);
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

      // Optimistic add
      setVenue((v) => (v ? { ...v, bookings: [...(v.bookings ?? []), lite] } : v));
      setRange(undefined);
      toast.success('Booking confirmed!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBookingBusy(false);
    }
  }

  /** Route to /login with redirect back to this venue if unauthenticated, otherwise book. */
  function onBookClick() {
    if (!loggedIn) {
      const redirect = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    handleBook();
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

      <VenueGallery venue={venue} priority />

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
        <div className="mt-3 flex items-center justify-between" aria-live="polite">
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
        <label className="text-sm" htmlFor="guests">
          Guests
        </label>
        <input
          id="guests"
          type="number"
          min={1}
          max={venue.maxGuests}
          value={guests}
          onChange={(e) => {
            const n = Number(e.target.value) || 1;
            setGuests(Math.max(1, Math.min(venue.maxGuests, n)));
          }}
          className="w-20 field"
        />
        <span className="text-sm text-muted">/ max {venue.maxGuests}</span>

        <div className="ml-auto text-right">
          {!loggedIn && (
            <p className="mb-1 text-sm text-muted">
              You must{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(`/venues/${venue.id}`)}`}
                className="underline text-brand"
              >
                log in
              </Link>{' '}
              to book.
            </p>
          )}

          <Button
            onClick={onBookClick}
            disabled={ctaDisabled}
            isLoading={bookingBusy}
            variant="primary"
            title={
              missingDates
                ? 'Pick check-in and check-out first'
                : isOwner
                  ? "You can't book your own venue"
                  : !loggedIn
                    ? 'Log in to book'
                    : undefined
            }
          >
            Book this venue
          </Button>
        </div>
      </div>

      {/* Location */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Location</h2>
        <p className="text-muted mb-3">{locationText}</p>

        {coords ? (
          <Suspense
            fallback={<div className="h-[320px] rounded-lg border border-border bg-muted" />}
          >
            <VenueMap lat={coords.lat} lng={coords.lng} name={venue.name} height={320} />
          </Suspense>
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
        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </article>
  );
}
