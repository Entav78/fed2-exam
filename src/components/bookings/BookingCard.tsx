import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import type { Booking } from '@/lib/api/bookings';
import { getVenueImage, handleImgErrorToPlaceholder } from '@/utils/venueImage';

const THUMB_W = 96;
const THUMB_H = 64;

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
        isPast ? 'bg-[rgb(var(--fg))/0.03] ring-1 ring-[rgb(var(--fg))/0.08]' : ''
      }`}
    >
      {venueId ? (
        <Link
          to={`/venues/${venueId}`}
          className="group flex flex-1 min-w-0 items-center gap-4 -m-2 p-2 rounded
             focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-[rgb(var(--brand))/40]"
          title={`Open ${venueName}`}
        >
          <div className="h-16 w-24 overflow-hidden rounded border border-border shrink-0">
            <img
              src={src}
              alt={alt}
              width={THUMB_W}
              height={THUMB_H}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={handleImgErrorToPlaceholder}
            />
          </div>

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
          <div className="h-16 w-24 overflow-hidden rounded border border-border shrink-0">
            <img
              src={src}
              alt={alt}
              width={THUMB_W}
              height={THUMB_H}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={handleImgErrorToPlaceholder}
            />
          </div>
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
          <Button size="sm" variant="outline" onClick={() => onChangeDates(booking)}>
            Change dates
          </Button>
        )}
        {!isPast && onCancel && (
          <Button
            size="sm"
            variant="dangerOutline"
            onClick={() => {
              if (confirm('Cancel this booking?')) onCancel(booking.id);
            }}
            disabled={busy}
            isLoading={busy}
          >
            {busy ? 'Cancelling…' : 'Cancel'}
          </Button>
        )}
      </div>
    </div>
  );
}
