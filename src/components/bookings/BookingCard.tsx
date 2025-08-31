import { Link } from 'react-router-dom';

import type { Booking } from '@/lib/api/bookings';

type Props = {
  booking: Booking;
  onCancel?: (id: string) => void; // omit to hide the Cancel btn
  busy?: boolean; // true => disable + show “Cancelling…”
};

export default function BookingCard({ booking, onCancel, busy }: Props) {
  const isPast = new Date(booking.dateTo) < new Date();
  const img = booking.venue?.media?.[0];
  const city = booking.venue?.location?.city;
  const start = new Date(booking.dateFrom);
  const end = new Date(booking.dateTo);
  const venueId = booking.venue?.id;
  const venueName = booking.venue?.name ?? 'Venue';

  return (
    <div
      className={`flex items-center gap-4 rounded border border-border-light bg-card p-4 shadow ${
        isPast ? 'opacity-80' : ''
      }`}
    >
      {/* Clickable content area */}
      {venueId ? (
        <Link
          to={`/venues/${venueId}`}
          className="flex flex-1 min-w-0 items-center gap-4 -m-2 p-2 rounded hover:bg-muted/40"
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
            <p className="mt-1 text-sm">
              {start.toLocaleDateString()} → {end.toLocaleDateString()} • Guests {booking.guests}
            </p>
          </div>
        </Link>
      ) : (
        <>
          {/* Fallback if no venue id */}
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
            <p className="font-semibold leading-tight line-clamp-1">{venueName}</p>
            {city && <p className="text-sm text-muted">{city}</p>}
            <p className="mt-1 text-sm">
              {start.toLocaleDateString()} → {end.toLocaleDateString()} • Guests {booking.guests}
            </p>
          </div>
        </>
      )}

      {/* Actions (stay as buttons, not links) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Optional: add a Change dates button that opens your dialog */}
        {/* <button onClick={() => onChangeDates?.(booking)} className="rounded border px-3 py-1 text-sm hover:bg-muted">
          Change dates
        </button> */}

        {!isPast && onCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={busy}
            className={`rounded border border-border-light px-3 py-1 text-sm ${
              busy ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted'
            }`}
          >
            {busy ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}
