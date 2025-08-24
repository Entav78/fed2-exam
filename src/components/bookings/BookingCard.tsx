import { Link } from 'react-router-dom';

import type { Booking } from '@/lib/api/bookings';

type Props = {
  booking: Booking;
  onCancel?: (id: string) => void; // omit to hide the Cancel btn
  busy?: boolean; // true => disable + show “Cancelling…”
};

export default function BookingCard({ booking, onCancel, busy }: Props) {
  const img = booking.venue?.media?.[0];
  const city = booking.venue?.location?.city;

  const start = new Date(booking.dateFrom);
  const end = new Date(booking.dateTo);
  const isPast = end.getTime() < Date.now();

  return (
    <div
      className={`flex items-center gap-4 rounded border border-border-light bg-card p-4 shadow ${
        isPast ? 'opacity-80' : ''
      }`}
    >
      {/* thumbnail */}
      {img?.url ? (
        <img
          src={img.url}
          alt={img.alt || booking.venue?.name || 'Venue image'}
          className="h-16 w-16 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-16 w-16 rounded bg-muted" />
      )}

      {/* info */}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight line-clamp-1">{booking.venue?.name ?? 'Venue'}</p>
        {city && <p className="text-sm text-muted">{city}</p>}
        <p className="mt-1 text-sm">
          {start.toLocaleDateString()} → {end.toLocaleDateString()} • Guests {booking.guests}
        </p>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2">
        {booking.venue?.id && (
          <Link
            to={`/venues/${booking.venue.id}`}
            className="rounded border border-border-light px-3 py-1 text-sm hover:bg-muted"
          >
            Open
          </Link>
        )}

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
