import { useEffect, useMemo, useState } from 'react';

import VenueCard from '@/components/venues/VenueCard';
import VenueFilters, { type VenueFiltersState } from '@/components/venues/VenueFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchVenues, isVenueAvailable, type Venue } from '@/lib/api/venues';

// Build only the fields the API cares about for the list call
function toVenueListParams(p: {
  q?: string;
  sort?: 'price' | 'rating' | 'created';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) {
  const q = (p.q ?? '').trim();
  return {
    ...(q ? { q } : {}),
    ...(p.sort ? { sort: p.sort } : {}),
    ...(p.order ? { sortOrder: p.order } : {}),
    ...(p.page ? { page: p.page } : {}),
    ...(p.limit ? { limit: p.limit } : {}),
    bookings: true,
    owner: true,
  } as const;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  const API_LIMIT = 50;

  // default: tomorrow → 2 nights
  const [dateFrom, setDateFrom] = useState(toISODate(addDays(new Date(), 1)));
  const [dateTo, setDateTo] = useState(toISODate(addDays(new Date(), 3)));
  const [guests, setGuests] = useState(2);

  const [filters, setFilters] = useState<VenueFiltersState>({
    q: '',
    sort: 'created',
    order: 'desc',
  });
  const debouncedQ = useDebouncedValue(filters.q, 300);

  const [allFetched, setAllFetched] = useState<Venue[]>([]);
  const [fetchPage, setFetchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load (and when q/sort/order change)
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setAllFetched([]);
    setFetchPage(1);
    setHasMore(true);

    (async () => {
      try {
        // Try server-side q
        let page1 = await fetchVenues(
          toVenueListParams({
            q: debouncedQ,
            sort: filters.sort,
            order: filters.order,
            page: 1,
            limit: API_LIMIT,
          }),
        );

        // Fallback: same request without q if nothing came back
        if (debouncedQ && page1.length === 0) {
          page1 = await fetchVenues(
            toVenueListParams({
              sort: filters.sort,
              order: filters.order,
              page: 1,
              limit: API_LIMIT,
            }),
          );
        }

        if (!active) return;
        setAllFetched(page1);
        setHasMore(page1.length === API_LIMIT);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedQ, filters.sort, filters.order]);

  // “Load more results”
  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = fetchPage + 1;

    try {
      let data = await fetchVenues(
        toVenueListParams({
          q: debouncedQ,
          sort: filters.sort,
          order: filters.order,
          page: nextPage,
          limit: API_LIMIT,
        }),
      );

      if (debouncedQ && data.length === 0) {
        data = await fetchVenues(
          toVenueListParams({
            sort: filters.sort,
            order: filters.order,
            page: nextPage,
            limit: API_LIMIT,
          }),
        );
      }

      setAllFetched((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        const merged = [...prev];
        for (const v of data) if (!seen.has(v.id)) merged.push(v);
        return merged;
      });

      setFetchPage(nextPage);
      setHasMore(data.length === API_LIMIT);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  // Availability first
  const available = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return allFetched.filter((v) => isVenueAvailable(v, dateFrom, dateTo, guests));
  }, [allFetched, dateFrom, dateTo, guests]);

  // Then UI filters + client-side matching + sort
  const visibleVenues = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();

    const hay = (v: Venue) =>
      [
        v.name,
        v.description,
        v.location?.address,
        v.location?.city,
        v.location?.zip,
        v.location?.country,
        v.owner?.name,
        v.owner?.email,
        ...(v.media?.map((m) => m.alt) ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    let list = available.filter((v) => !q || hay(v).includes(q));
    if (filters.guests) list = list.filter((v) => v.maxGuests >= Number(filters.guests));
    if (filters.minPrice) list = list.filter((v) => v.price >= Number(filters.minPrice));
    if (filters.maxPrice) list = list.filter((v) => v.price <= Number(filters.maxPrice));
    if (filters.wifi) list = list.filter((v) => !!v.meta?.wifi);
    if (filters.parking) list = list.filter((v) => !!v.meta?.parking);
    if (filters.breakfast) list = list.filter((v) => !!v.meta?.breakfast);
    if (filters.pets) list = list.filter((v) => !!v.meta?.pets);

    const dir = filters.order === 'asc' ? 1 : -1;
    if (filters.sort === 'price') list.sort((a, b) => (a.price - b.price) * dir);
    else if (filters.sort === 'rating')
      list.sort((a, b) => ((a.rating ?? 0) - (b.rating ?? 0)) * dir);

    // For "Newest" we keep server order (no-op)
    return list;
  }, [available, debouncedQ, filters]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Find available venues</h1>

      <VenueFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
        }}
        onClear={() => {
          setFilters({ q: '', sort: 'created', order: 'desc' });
        }}
      />

      {/* Availability form */}
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_120px] items-end mb-6"
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
      </form>

      {loading && <p>Loading…</p>}
      {error && <p className="text-danger">Error: {error}</p>}
      {!loading && !error && visibleVenues.length === 0 && (
        <p className="text-muted">No available venues match your criteria.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleVenues.map((v) => (
          <li key={v.id}>
            <VenueCard venue={v} />
          </li>
        ))}
      </ul>

      {hasMore && !loading && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded border border-border-light px-4 py-2"
          >
            {loadingMore ? 'Loading…' : 'Load more results'}
          </button>
        </div>
      )}
    </div>
  );
}
