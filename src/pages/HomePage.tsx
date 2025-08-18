import { useEffect, useState } from 'react';
import { fetchVenues, type Venue } from '@/lib/api/venues';
import VenueCard from '@/components/venues/VenueCard';
import Pagination from '@/components/ui/Pagination';

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Debounced fetch on mount + when search changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const data = await fetchVenues({ q: searchTerm, limit: 100 }); // client-side paginate
        if (active) {
          setVenues(data);
          setCurrentPage(1);
          setError(null);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(venues.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = venues.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Venues</h1>

      <div className="mb-4">
        <label className="block text-sm mb-1" htmlFor="search">
          Search
        </label>
        <input
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or description…"
          className="w-full rounded-md border border-border-light px-3 py-2 bg-input-light text-text placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-danger">Error: {error}</p>}

      {!loading && !error && pageItems.length === 0 && (
        <p className="text-muted">No venues found.</p>
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
