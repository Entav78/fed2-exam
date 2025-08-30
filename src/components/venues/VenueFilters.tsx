import React from 'react';

export type VenueFiltersState = {
  q: string;
  minPrice?: string;
  maxPrice?: string;
  guests?: string;
  wifi?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  pets?: boolean;
  sort?: 'price' | 'rating' | 'created';
  order?: 'asc' | 'desc';
  country?: string;
};

type Props = {
  value: VenueFiltersState;
  onChange: (next: VenueFiltersState) => void;
  onClear?: () => void;
  countries?: string[];
};

export default function VenueFilters({ value, onChange, onClear, countries = [] }: Props) {
  type TextKeys = 'q' | 'minPrice' | 'maxPrice' | 'country';
  type BoolKeys = 'wifi' | 'parking' | 'breakfast' | 'pets';

  const onText = (k: TextKeys) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.currentTarget.value });

  const onBool = (k: BoolKeys) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.currentTarget.checked });

  const sortKey = `${value.sort ?? 'created'}:${value.order ?? 'desc'}`;
  const onSortKey = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sort, order] = e.currentTarget.value.split(':') as [
      'created' | 'price' | 'rating',
      'asc' | 'desc',
    ];
    onChange({ ...value, sort, order });
  };

  return (
    <div className="rounded border border-border-light bg-card p-3 grid gap-3 md:grid-cols-4">
      {/* Search */}
      <input
        className="input-field md:col-span-2"
        placeholder="Search venues…"
        value={value.q}
        onChange={onText('q')}
      />

      {/* Price min / max */}
      <div className="flex gap-2">
        <input
          className="input-field"
          placeholder="Min price"
          inputMode="numeric"
          value={value.minPrice ?? ''}
          onChange={onText('minPrice')}
        />
        <input
          className="input-field"
          placeholder="Max price"
          inputMode="numeric"
          value={value.maxPrice ?? ''}
          onChange={onText('maxPrice')}
        />
      </div>

      {/* Sort (combined) */}
      <div className="flex gap-2">
        <select className="input-field" value={sortKey} onChange={onSortKey}>
          <option value="created:desc">Newest</option>
          <option value="price:asc">Price: Low → High</option>
          <option value="price:desc">Price: High → Low</option>
          <option value="rating:desc">Rating: High → Low</option>
          <option value="rating:asc">Rating: Low → High</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value.wifi} onChange={onBool('wifi')} /> Wifi
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value.parking} onChange={onBool('parking')} /> Parking
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value.breakfast} onChange={onBool('breakfast')} />{' '}
          Breakfast
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value.pets} onChange={onBool('pets')} /> Pets
        </label>
      </div>

      {/* Optional: Country */}
      {countries.length > 0 && (
        <div className="md:col-span-4">
          <select
            className="input-field"
            value={value.country ?? ''}
            onChange={onText('country')}
            aria-label="Filter by country"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="md:col-span-4 flex justify-end">
        <button
          type="button"
          className="rounded border border-border-light px-3 py-1 text-sm"
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
