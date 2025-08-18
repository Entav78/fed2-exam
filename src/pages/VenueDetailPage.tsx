import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVenueById, type Venue } from '@/lib/api/venues';

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

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!venue) return <p className="text-muted">No venue found.</p>;

  const img = venue.media?.[0]?.url;

  return (
    <article className="max-w-4xl mx-auto">
      <Link to="/" className="text-brand underline">
        &larr; Back to search
      </Link>

      <h1 className="text-3xl font-bold mt-2">{venue.name}</h1>
      <p className="text-muted">Max guests: {venue.maxGuests}</p>
      <p className="font-semibold mt-1">{venue.price} NOK / night</p>

      {img && (
        <img
          src={img}
          alt={venue.media?.[0]?.alt || venue.name}
          className="mt-4 w-full rounded-lg object-cover max-h-[420px]"
        />
      )}

      {venue.description && <p className="mt-4">{venue.description}</p>}

      <section className="mt-6">
        <h2 className="font-semibold mb-2">Booked dates</h2>
        {venue.bookings?.length ? (
          <ul className="list-disc pl-5 text-sm">
            {venue.bookings.map((b) => (
              <li key={b.id}>
                {new Date(b.dateFrom).toLocaleDateString()} →{' '}
                {new Date(b.dateTo).toLocaleDateString()} · guests {b.guests}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-sm">No bookings yet.</p>
        )}
      </section>

      <button
        className="mt-6 px-4 py-2 rounded bg-brand text-white"
        onClick={() => alert('Booking flow coming next ✨')}
      >
        Book this venue
      </button>
    </article>
  );
}

