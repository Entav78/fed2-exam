/** @file VenueFilter – compact filter bar for searching, pricing, amenities, location, and sort order. */

import React from 'react';

import { Button } from '@/components/ui/Button';

/** Shape of the filter state driven by this component. */
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
  city?: string;
};

/** Props for {@link VenueFilters}. */
type Props = {
  /** Current filter values (controlled). */
  value: VenueFiltersState;
  /** Called whenever a filter value changes with the full next state. */
  onChange: (next: VenueFiltersState) => void;
  /** Optional clear-all handler. */
  onClear?: () => void;
  /** Available countries (for the country select). */
  countries?: string[];
  /** Available cities (depends on country). */
  cities?: string[];
  /** Whether rating sort options should be shown. */
  hasRatings?: boolean;
};

/**
 * VenueFilters
 *
 * Controlled filter group:
 * - Search query, min/max price, amenity toggles
 * - Country/City selects (city disabled until a country is chosen)
 * - Combined sort dropdown (sort + order in one value)
 */
export default function VenueFilters({
  value,
  onChange,
  onClear,
  countries = [],
  cities = [],
  hasRatings = false,
}: Props) {
  type TextKeys = 'q' | 'minPrice' | 'maxPrice' | 'country' | 'city';
  type BoolKeys = 'wifi' | 'parking' | 'breakfast' | 'pets';

  const onText = (k: TextKeys) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.currentTarget.value });

  const onBool = (k: BoolKeys) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.currentTarget.checked });

  // Combine sort + order in one dropdown
  const sortKey = `${value.sort ?? 'created'}:${value.order ?? 'desc'}`;
  const onSortKey = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sort, order] = e.currentTarget.value.split(':') as [
      'created' | 'price' | 'rating',
      'asc' | 'desc',
    ];
    onChange({ ...value, sort, order });
  };

  // When country changes, clear city if country becomes empty
  const onCountryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const nextCountry = e.currentTarget.value;
    const next = { ...value, country: nextCountry };
    if (!nextCountry) next.city = '';
    onChange(next);
  };

  return (
    <div className="grid gap-3 rounded border border-border bg-card p-3 md:grid-cols-4">
      {/* Search */}
      <input
        className="field md:col-span-2"
        placeholder="Search venues…"
        value={value.q}
        onChange={onText('q')}
      />

      {/* Price min / max */}
      <div className="flex gap-2">
        <input
          className="field"
          placeholder="Min price"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value.minPrice ?? ''}
          onChange={onText('minPrice')}
        />
        <input
          className="field"
          placeholder="Max price"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value.maxPrice ?? ''}
          onChange={onText('maxPrice')}
        />
      </div>

      {/* Sort (combined) */}
      <div className="flex gap-2">
        <label htmlFor="sortKey" className="sr-only">
          Sort
        </label>
        <select id="sortKey" className="field" value={sortKey} onChange={onSortKey}>
          <option value="created:desc">Newest</option>
          <option value="price:asc">Price: Low → High</option>
          <option value="price:desc">Price: High → Low</option>
          {hasRatings && (
            <>
              <option value="rating:desc">Rating: High → Low</option>
              <option value="rating:asc">Rating: Low → High</option>
            </>
          )}
        </select>
      </div>

      {/* Toggles */}
      <div className="md:col-span-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[rgb(var(--brand))]"
            checked={!!value.wifi}
            onChange={onBool('wifi')}
          />
          <span>Wifi</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[rgb(var(--brand))]"
            checked={!!value.parking}
            onChange={onBool('parking')}
          />
          <span>Parking</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[rgb(var(--brand))]"
            checked={!!value.breakfast}
            onChange={onBool('breakfast')}
          />
          <span>Breakfast</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[rgb(var(--brand))]"
            checked={!!value.pets}
            onChange={onBool('pets')}
          />
          <span>Pets</span>
        </label>
      </div>

      {/* Country & City */}
      <div className="grid grid-cols-2 gap-2 md:col-span-2">
        <label htmlFor="country" className="sr-only">
          Country
        </label>
        <select
          id="country"
          className="field"
          value={value.country ?? ''}
          onChange={onCountryChange}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="city" className="sr-only">
          City
        </label>
        <select
          id="city"
          className="field"
          value={value.city ?? ''}
          onChange={onText('city')}
          disabled={!value.country || cities.length === 0}
          title={!value.country ? 'Pick a country first' : undefined}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4 flex justify-end">
        <Button variant="outline" size="sm" type="button" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
