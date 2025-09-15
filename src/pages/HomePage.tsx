import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import VenueCard from '@/components/venues/VenueCard';
import VenueFilters, { type VenueFiltersState } from '@/components/venues/VenueFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchVenues, isVenueAvailable, type Venue } from '@/lib/api/venues';
import { normalizeCity } from '@/lib/cities';
import { normalizeCountry } from '@/lib/countries';
import { isImagelessVenue } from '@/utils/venueImage';

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
  const API_LIMIT = 24;

  // default: tomorrow → 2 nights
  const [dateFrom, setDateFrom] = useState(toISODate(addDays(new Date(), 1)));
  const [dateTo, setDateTo] = useState(toISODate(addDays(new Date(), 3)));
  const [guests, setGuests] = useState(2);

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const minTo = useMemo(() => toISODate(addDays(new Date(dateFrom), 1)), [dateFrom]);
  const [includeNoImage, setIncludeNoImage] = useState(false);

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

  const hasRatings = useMemo(
    () => allFetched.some((v) => Number.isFinite(v.rating) && (v.rating ?? 0) > 0),
    [allFetched],
  );

  // If rating becomes unavailable, fall back to "Newest"
  useEffect(() => {
    if (filters.sort === 'rating' && !hasRatings) {
      setFilters((f) => ({ ...f, sort: 'created', order: 'desc' }));
    }
  }, [hasRatings]); // eslint-disable-line

  const countries = useMemo(() => {
    const names = allFetched
      .map((v) => normalizeCountry(v.location?.country ?? null))
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(names)).sort();
  }, [allFetched]);

  const cities = useMemo(() => {
    if (!filters.country) return [];
    const wanted = filters.country; // canonical country
    const list = allFetched
      .filter((v) => normalizeCountry(v.location?.country ?? null) === wanted)
      .map((v) => normalizeCity(v.location?.city ?? null))
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [allFetched, filters.country]);

  // If the current city becomes invalid after country change, clear it
  useEffect(() => {
    if (filters.city && !cities.includes(filters.city)) {
      setFilters((f) => ({ ...f, city: undefined }));
    }
  }, [filters.city, cities, setFilters]); // run when country or the set of cities changes

  const [searchParams, setSearchParams] = useSearchParams();
  const spKey = searchParams.toString();

  useEffect(() => {
    const next = new URLSearchParams(spKey); // preserve unrelated params safely

    const setOrDelete = (sp: URLSearchParams, k: string, v?: string | number | boolean | null) => {
      if (v === undefined || v === null || v === '' || v === false) sp.delete(k);
      else sp.set(k, String(v));
    };

    setOrDelete(next, 'q', debouncedQ || undefined);
    setOrDelete(next, 'sort', filters.sort !== 'created' ? filters.sort : undefined);
    setOrDelete(next, 'order', filters.order !== 'desc' ? filters.order : undefined);
    setOrDelete(next, 'min', filters.minPrice);
    setOrDelete(next, 'max', filters.maxPrice);
    setOrDelete(next, 'minGuests', filters.guests);
    setOrDelete(next, 'wifi', filters.wifi ? 1 : undefined);
    setOrDelete(next, 'parking', filters.parking ? 1 : undefined);
    setOrDelete(next, 'breakfast', filters.breakfast ? 1 : undefined);
    setOrDelete(next, 'pets', filters.pets ? 1 : undefined);
    setOrDelete(next, 'country', filters.country || undefined);
    setOrDelete(next, 'city', filters.city || undefined);
    setOrDelete(next, 'noimg', includeNoImage ? 1 : undefined);

    // Availability controls
    setOrDelete(next, 'from', dateFrom);
    setOrDelete(next, 'to', dateTo);
    setOrDelete(next, 'guests', guests > 1 ? guests : undefined);

    setSearchParams(next, { replace: true });
  }, [
    spKey, // 👈 replaces searchParams in deps
    debouncedQ,
    filters.sort,
    filters.order,
    filters.minPrice,
    filters.maxPrice,
    filters.guests,
    filters.wifi,
    filters.parking,
    filters.breakfast,
    filters.pets,
    filters.country,
    filters.city,
    dateFrom,
    dateTo,
    guests,
    includeNoImage,
    setSearchParams,
  ]);

  useEffect(() => {
    // Filters
    setFilters((prev) => ({
      ...prev,
      q: searchParams.get('q') ?? '',
      sort: (searchParams.get('sort') as 'created' | 'price' | 'rating') ?? 'created',
      order: (searchParams.get('order') as 'asc' | 'desc') ?? 'desc',
      minPrice: searchParams.get('min') ?? undefined,
      maxPrice: searchParams.get('max') ?? undefined,
      guests: searchParams.get('minGuests') ?? undefined,
      wifi: searchParams.get('wifi') === '1' || searchParams.get('wifi') === 'true',
      parking: searchParams.get('parking') === '1' || searchParams.get('parking') === 'true',
      breakfast: searchParams.get('breakfast') === '1' || searchParams.get('breakfast') === 'true',
      pets: searchParams.get('pets') === '1' || searchParams.get('pets') === 'true',
      country: searchParams.get('country') ?? undefined,
      city: searchParams.get('city') ?? undefined,
    }));

    // Availability controls
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const g = searchParams.get('guests');

    if (from) setDateFrom(from);
    if (to) setDateTo(to);
    if (g && !Number.isNaN(+g)) setGuests(Math.max(1, +g));

    // ✅ include-no-image toggle (own state)
    setIncludeNoImage(searchParams.get('noimg') === '1' || searchParams.get('noimg') === 'true');

    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadMore = useCallback(async () => {
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
  }, [API_LIMIT, debouncedQ, filters.order, filters.sort, fetchPage, hasMore, loadingMore]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return; // nothing to observe if there’s no more pages
    if (loading || loadingMore) return;

    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // small microtask delay to avoid rapid double fires
          Promise.resolve().then(() => loadMore());
        }
      },
      { root: null, rootMargin: '800px 0px 0px 0px', threshold: 0 }, // start early
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  // Availability first
  const available = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return allFetched.filter((v) => isVenueAvailable(v, dateFrom, dateTo, guests));
  }, [allFetched, dateFrom, dateTo, guests]);

  const filteredVenues = useMemo(() => {
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

    let list = available;

    // country/city first (canonical names)
    if (filters.country) {
      list = list.filter((v) => normalizeCountry(v.location?.country ?? null) === filters.country);
    }
    if (filters.city) {
      list = list.filter((v) => normalizeCity(v.location?.city ?? null) === filters.city);
    }

    // free-text
    if (q) list = list.filter((v) => hay(v).includes(q));

    // numeric/toggles
    if (filters.guests) list = list.filter((v) => v.maxGuests >= Number(filters.guests));
    if (filters.minPrice) list = list.filter((v) => v.price >= Number(filters.minPrice));
    if (filters.maxPrice) list = list.filter((v) => v.price <= Number(filters.maxPrice));
    if (filters.wifi) list = list.filter((v) => !!v.meta?.wifi);
    if (filters.parking) list = list.filter((v) => !!v.meta?.parking);
    if (filters.breakfast) list = list.filter((v) => !!v.meta?.breakfast);
    if (filters.pets) list = list.filter((v) => !!v.meta?.pets);

    // sort (clone before sorting)
    const dir = filters.order === 'asc' ? 1 : -1;
    if (filters.sort === 'price') return [...list].sort((a, b) => (a.price - b.price) * dir);
    if (filters.sort === 'rating')
      return [...list].sort((a, b) => ((a.rating ?? 0) - (b.rating ?? 0)) * dir);

    // "Newest" – keep server order
    return list;
  }, [available, debouncedQ, filters]);

  const hiddenCount = useMemo(
    () => filteredVenues.filter(isImagelessVenue).length,
    [filteredVenues],
  );

  const visibleVenues = useMemo(
    () => (includeNoImage ? filteredVenues : filteredVenues.filter((v) => !isImagelessVenue(v))),
    [filteredVenues, includeNoImage],
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Find available venues</h1>

      <VenueFilters
        value={filters}
        onChange={(next) => setFilters(next)}
        onClear={() => {
          setFilters({ q: '', sort: 'created', order: 'desc' });
          setIncludeNoImage(false); // optional
        }}
        countries={countries}
        cities={cities}
        hasRatings={hasRatings}
      />

      {/* Availability form */}
      <form
        className="
    grid gap-3 items-end mb-6 overflow-hidden max-w-full
    sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]
  "
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block min-w-0">
          <span className="block text-sm mb-1">From</span>
          <input
            type="date"
            value={dateFrom}
            min={todayISO}
            onChange={(e) => {
              const v = e.target.value;
              setDateFrom(v);
              if (dateTo <= v) setDateTo(toISODate(addDays(new Date(v), 1)));
            }}
            className="field w-full"
          />
        </label>

        <label className="block min-w-0">
          <span className="block text-sm mb-1">To</span>
          <input
            type="date"
            value={dateTo}
            min={minTo}
            onChange={(e) => {
              const v = e.target.value;
              setDateTo(v <= dateFrom ? minTo : v);
            }}
            className="field w-full"
          />
        </label>

        <label className="block min-w-0">
          <span className="block text-sm mb-1">Guests</span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
            className="field w-full"
          />
        </label>

        <label className="mb-3 inline-flex items-center gap-2 cursor-pointer select-none min-w-0">
          <input
            id="include-no-image"
            type="checkbox"
            checked={includeNoImage}
            onChange={(e) => setIncludeNoImage(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">Include venues without photo/map</span>
          {!includeNoImage && hiddenCount > 0 && (
            <span className="text-xs text-muted">({hiddenCount} hidden)</span>
          )}
        </label>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p className="text-danger">Error: {error}</p>}
      {!loading && !error && visibleVenues.length === 0 && (
        <p className="text-muted">No available venues match your criteria.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleVenues.map((v, i) => (
          <li key={v.id}>
            <VenueCard venue={v} priority={i === 0} />
          </li>
        ))}
      </ul>

      {/* Sentinel + manual fallback */}
      <div className="mt-6 flex h-10 items-center justify-center">
        <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
        {loadingMore ? (
          <span className="flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Loading more…
          </span>
        ) : hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
          >
            Load more
          </button>
        ) : (
          <span className="text-sm text-muted">No more results</span>
        )}
      </div>
    </div>
  );
}
