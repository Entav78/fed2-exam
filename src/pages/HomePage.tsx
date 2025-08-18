import { useEffect, useMemo, useState } from 'react';
import { fetchVenues, isVenueAvailable, type Venue } from '@/lib/api/venues';
import VenueCard from '@/components/venues/VenueCard';
import Pagination from '@/components/ui/Pagination';

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toISODate(d: Date) {
  // yyyy-mm-dd (HTML date input likes this; Date.parse will treat as UTC)
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  // default: tomorrow → 2 nights
  const [dateFrom, setDateFrom] = useState(toISODate(addDays(new Date(), 1)));
  const [dateTo, setDateTo] = useState(toISODate(addDays(new Date(), 3)));
  const [guests, setGuests] = useState(2);
  const [search, setSearch] = useState(''); // optional text search

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  // Load venues with bookings so we can filter availability locally
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data = await fetchVenues({
          bookings: true,
          limit: 100,
          q: search,
        });
        if (active) {
          setVenues(data);
          setError(null);
          setCurrentPage(1);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search]);

  // Compute available venues based on date/guests
  const available = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return venues.filter((v) => isVenueAvailable(v, dateFrom, dateTo, guests));
  }, [venues, dateFrom, dateTo, guests]);

  const totalPages = Math.max(1, Math.ceil(available.length / perPage));
  const pageStart = (currentPage - 1) * perPage;
  const pageItems = available.slice(pageStart, pageStart + perPage);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Find available venues</h1>

      {/* Availability form */}
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_120px] items-end mb-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block">
          <span className="block text-sm mb-1">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-md border border-border-light px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="block text-sm mb-1">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-md border border-border-light px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="block text-sm mb-1">Guests</span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-md border border-border-light px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="block text-sm mb-1">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="City, name, description…"
            className="w-full rounded-md border border-border-light px-3 py-2"
          />
        </label>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p className="text-danger">Error: {error}</p>}

      {!loading && !error && pageItems.length === 0 && (
        <p className="text-muted">No available venues match your criteria.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((v) => (
          <li key={v.id}>
            <VenueCard venue={v} />
          </li>
        ))}
      </ul>

      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
