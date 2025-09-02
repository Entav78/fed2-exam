import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { MiniButton } from '@/components/ui/MiniButton';
import type { Booking } from '@/lib/api/bookings';
import { getVenueImage, handleImgErrorToPlaceholder } from '@/utils/venueImage';

type Props = {
  booking: Booking;
  onCancel?: (id: string) => void;
  onChangeDates?: (b: Booking) => void;
  busy?: boolean;
};

export default function BookingCard({ booking, onCancel, onChangeDates, busy = false }: Props) {
  const todayMidnightMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const isPast = new Date(booking.dateTo).getTime() <= todayMidnightMs;
  const city = booking.venue?.location?.city;
  const start = new Date(booking.dateFrom);
  const end = new Date(booking.dateTo);
  const venueId = booking.venue?.id;
  const venueName = booking.venue?.name ?? 'Venue';

  // ✅ One source of truth for the thumbnail (handles placeholder automatically)
  const { src, alt } = getVenueImage(booking.venue);

  return (
    <div
      className={`card h-full min-h-[112px] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 ${
        isPast ? 'opacity-80' : ''
      }`}
    >
      {venueId ? (
        <Link
          to={`/venues/${venueId}`}
          className="flex flex-1 min-w-0 items-center gap-4 -m-2 p-2 rounded hover:bg-muted/40"
          title={`Open ${venueName}`}
        >
          <img
            src={src}
            alt={alt}
            className="thumb"
            loading="lazy"
            decoding="async"
            onError={handleImgErrorToPlaceholder}
          />

          <div className="min-w-0">
            <p className="font-semibold leading-tight line-clamp-1 hover:underline">{venueName}</p>
            {city && <p className="text-sm text-muted">{city}</p>}
            <div className="mt-1 text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="whitespace-nowrap">
                {start.toLocaleDateString()} → {end.toLocaleDateString()}
              </span>
              <span className="hidden sm:inline-block">•</span>
              <span className="whitespace-nowrap">Guests {booking.guests}</span>
            </div>
          </div>
        </Link>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            className="thumb"
            loading="lazy"
            decoding="async"
            onError={handleImgErrorToPlaceholder}
          />
          <div className="min-w-0 flex-1">
            <p className="mt-1 text-sm flex flex-wrap items-center gap-x-2">{venueName}</p>
            {city && <p className="text-sm text-muted">{city}</p>}
            <p className="mt-1 text-sm">
              {start.toLocaleDateString()} → {end.toLocaleDateString()} • Guests {booking.guests}
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {!!onChangeDates && !!venueId && !isPast && (
          <MiniButton onClick={() => onChangeDates(booking)}>Change dates</MiniButton>
        )}
        {!isPast && onCancel && (
          <MiniButton onClick={() => onCancel(booking.id)} disabled={busy}>
            {busy ? 'Cancelling…' : 'Cancel'}
          </MiniButton>
        )}
      </div>
    </div>
  );
}
