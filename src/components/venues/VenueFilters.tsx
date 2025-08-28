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
};

type Props = {
  value: VenueFiltersState;
  onChange: (next: VenueFiltersState) => void;
  onClear?: () => void;
};

export default function VenueFilters({ value, onChange, onClear }: Props) {
  const on =
    (k: keyof VenueFiltersState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [k]: e.currentTarget.value });

  const onBool = (k: keyof VenueFiltersState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.currentTarget.checked });

  return (
    <div className="rounded border border-border-light bg-card p-3 grid gap-3 md:grid-cols-4">
      <input
        className="input-field md:col-span-2"
        placeholder="Search venues…"
        value={value.q}
        onChange={on('q')}
      />
      <div className="flex gap-2">
        <input
          className="input-field"
          placeholder="Min"
          inputMode="numeric"
          value={value.minPrice ?? ''}
          onChange={on('minPrice')}
        />
        <input
          className="input-field"
          placeholder="Max"
          inputMode="numeric"
          value={value.maxPrice ?? ''}
          onChange={on('maxPrice')}
        />
      </div>
      <div className="flex gap-2">
        <input
          className="input-field"
          placeholder="Guests"
          inputMode="numeric"
          value={value.guests ?? ''}
          onChange={on('guests')}
        />
        <select className="input-field" value={value.sort ?? 'created'} onChange={on('sort')}>
          <option value="created">Newest</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
        </select>
        <select className="input-field" value={value.order ?? 'desc'} onChange={on('order')}>
          <option value="desc">↓</option>
          <option value="asc">↑</option>
        </select>
      </div>

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
