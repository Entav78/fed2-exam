//not in use at this stage

import type { VenueMeta } from '@/types/common';

type Props = {
  value?: Partial<VenueMeta>;
  onChange: (next: VenueMeta) => void;
  disabled?: boolean;
};

const DEFAULTS: VenueMeta = { wifi: false, parking: false, breakfast: false, pets: false };

export default function AmenitiesEditor({ value, onChange, disabled }: Props) {
  const meta = { ...DEFAULTS, ...(value ?? {}) };

  function setFlag<K extends keyof VenueMeta>(key: K, checked: boolean) {
    onChange({ ...meta, [key]: checked });
  }

  function setAll(val: boolean) {
    onChange({ wifi: val, parking: val, breakfast: val, pets: val });
  }

  const row = 'flex items-center gap-2';

  return (
    <fieldset className="rounded border border-border-light p-3 bg-card">
      <legend className="px-1 text-sm font-semibold">Amenities</legend>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={row}>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!meta.wifi}
            onChange={(e) => setFlag('wifi', e.target.checked)}
            disabled={disabled}
          />
          <span>Wi-Fi</span>
        </label>

        <label className={row}>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!meta.parking}
            onChange={(e) => setFlag('parking', e.target.checked)}
            disabled={disabled}
          />
          <span>Parking</span>
        </label>

        <label className={row}>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!meta.breakfast}
            onChange={(e) => setFlag('breakfast', e.target.checked)}
            disabled={disabled}
          />
          <span>Breakfast</span>
        </label>

        <label className={row}>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!meta.pets}
            onChange={(e) => setFlag('pets', e.target.checked)}
            disabled={disabled}
          />
          <span>Pets allowed</span>
        </label>
      </div>

      <div className="mt-3 flex gap-2 text-sm">
        <button
          type="button"
          className="underline text-brand"
          onClick={() => setAll(true)}
          disabled={disabled}
        >
          Select all
        </button>
        <button
          type="button"
          className="underline text-brand/80"
          onClick={() => setAll(false)}
          disabled={disabled}
        >
          Clear
        </button>
      </div>
    </fieldset>
  );
}
