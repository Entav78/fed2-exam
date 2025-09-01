import { Link } from 'react-router-dom';

import { MiniButton } from '@/components/ui/MiniButton';
import type { Booking } from '@/lib/api/bookings';

type Props = {
  booking: Booking;
  onCancel?: (id: string) => void;
  onChangeDates?: (b: Booking) => void;
  busy?: boolean;
};

export default function BookingCard({ booking, onCancel, onChangeDates, busy = false }: Props) {
  const isPast = new Date(booking.dateTo).getTime() < Date.now();
  const img = booking.venue?.media?.[0];
  const city = booking.venue?.location?.city;
  const start = new Date(booking.dateFrom);
  const end = new Date(booking.dateTo);
  const venueId = booking.venue?.id;
  const venueName = booking.venue?.name ?? 'Venue';

  return (
    <div
      className={`card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
        isPast ? 'opacity-80' : ''
      }`}
    >
      {/* Clickable content area */}
      {venueId ? (
        <Link
          to={`/venues/${venueId}`}
          className="flex flex-1 min-w-0 items-center gap-4 p-2 pr-3 sm:pr-4 rounded hover:bg-muted/40"
          title={`Open ${venueName}`}
        >
          {img?.url ? (
            <img
              src={img.url}
              alt={img.alt || venueName}
              className="h-16 w-16 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-16 w-16 rounded bg-muted" />
          )}

          <div className="min-w-0">
            <p className="font-semibold leading-tight line-clamp-1 hover:underline">{venueName}</p>
            {city && <p className="text-sm text-muted">{city}</p>}
            <div className="mt-1 text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="whitespace-nowrap">
                {start.toLocaleDateString()} → {end.toLocaleDateString()}
              </span>
              {/* separator shows only when there’s room */}
              <span className="hidden sm:inline-block">•</span>
              <span className="whitespace-nowrap">Guests {booking.guests}</span>
            </div>
          </div>
        </Link>
      ) : (
        <>
          {img?.url ? (
            <img
              src={img.url}
              alt={img.alt || venueName}
              className="h-16 w-16 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-16 w-16 rounded bg-muted" />
          )}
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
