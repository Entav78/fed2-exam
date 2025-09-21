/** @file ManageVenuePage – create/edit/delete a venue with images, amenities and location fields. */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import {
  createVenue,
  deleteVenue,
  getVenueById,
  updateVenue,
  type Venue,
  type VenueInput,
} from '@/lib/api/venues';
import { normalizeCity } from '@/lib/cities';
import { normalizeCountry } from '@/lib/countries';
import { useAuthStore } from '@/store/authStore';

/**
 * Local form shape for the venue editor.
 * Uses strings for most inputs to match <input> values and converts on submit.
 */
type FormState = {
  name: string;
  description: string;
  price: number | string;
  maxGuests: number | string;

  /** Multiple images; at least one row kept for UX. */
  images: Array<{ url: string; alt: string }>;

  /** Amenities (meta). */
  wifi: boolean;
  parking: boolean;
  breakfast: boolean;
  pets: boolean;

  /** Location fields; lat/lng captured as strings and validated on submit. */
  address: string;
  city: string;
  zip: string;
  country: string;
  continent: string;
  lat: string;
  lng: string;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  maxGuests: 1,
  images: [{ url: '', alt: '' }],

  wifi: false,
  parking: false,
  breakfast: false,
  pets: false,

  address: '',
  city: '',
  zip: '',
  country: '',
  continent: '',
  lat: '',
  lng: '',
};

/** Strongly-typed keys for amenity checkboxes. */
type BoolKey = 'wifi' | 'parking' | 'breakfast' | 'pets';

/**
 * ManageVenuePage
 *
 * - If `id` present, loads the venue and ensures the current user owns it.
 * - Tracks a dirty snapshot and warns on `beforeunload`.
 * - Validates inputs (URLs, lat/lng ranges) and normalizes country/city.
 * - Creates or updates a venue; allows deletion when editing.
 */
export default function ManageVenuePage() {
  const currentName = useAuthStore((s) => s.user?.name);
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const navigate = useNavigate();

  const isManager = useAuthStore((s) => s.isManager());
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setInitial(JSON.stringify(emptyForm));
      setForm(emptyForm);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const v = await getVenueById(id!, { owner: true, bookings: false });

        // Guard: only owners can edit their venues
        if (v.owner?.name && currentName && v.owner.name !== currentName) {
          toast.error('You can only edit your own venue');
          navigate('/profile');
          return;
        }

        const f = fromVenueToForm(v);
        setForm(f);
        setInitial(JSON.stringify(f));
      } catch (e) {
        toast.error((e as Error).message ?? 'Could not load venue');
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id, currentName, navigate]);

  const dirty = initial !== null && JSON.stringify(form) !== initial;

  // Warn on tab close if there are unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  if (!isManager) return <p className="text-danger">Managers only.</p>;
  if (loading) return <p>Loading…</p>;

  /**
   * Map an API `Venue` object to the local editable form state.
   */
  function fromVenueToForm(v: Venue): FormState {
    const imgs = (v.media ?? [])
      .map((m) => ({ url: m?.url ?? '', alt: m?.alt ?? '' }))
      .slice(0, 12);

    return {
      name: v.name ?? '',
      description: v.description ?? '',
      price: v.price ?? '',
      maxGuests: v.maxGuests ?? 1,
      images: imgs.length ? imgs : [{ url: '', alt: '' }],
      wifi: !!v.meta?.wifi,
      parking: !!v.meta?.parking,
      breakfast: !!v.meta?.breakfast,
      pets: !!v.meta?.pets,
      address: v.location?.address ?? '',
      city: v.location?.city ?? '',
      zip: v.location?.zip ?? '',
      country: v.location?.country ?? '',
      continent: v.location?.continent ?? '',
      lat: v.location?.lat?.toString() ?? '',
      lng: v.location?.lng?.toString() ?? '',
    };
  }

  /**
   * Convert form state to the API `VenueInput` payload, normalizing fields.
   */
  function toVenueInput(f: FormState): VenueInput {
    const media = f.images
      .map(({ url, alt }) => ({ url: url.trim(), alt: alt.trim() }))
      .filter((m) => m.url && /^https?:\/\//i.test(m.url));

    const val = (s?: string) => (s?.trim() ? s.trim() : undefined);
    const num = (s?: string) => (s && s.trim() !== '' ? Number(s) : undefined);
    const normalizedCountry = normalizeCountry(f.country);

    const location = {
      address: val(f.address),
      city: val(f.city),
      zip: val(f.zip),
      country: normalizedCountry ?? undefined,
      continent: val(f.continent),
      lat: num(f.lat),
      lng: num(f.lng),
    };

    return {
      name: f.name.trim(),
      description: f.description.trim() || undefined,
      price: Number(f.price) || 0,
      maxGuests: Number(f.maxGuests) || 1,
      media,
      meta: { wifi: f.wifi, parking: f.parking, breakfast: f.breakfast, pets: f.pets },
      location,
    };
  }

  /** Text/number input handler factory. */
  function onField<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.currentTarget.value;
      setForm((s) => ({ ...s, [key]: val }));
    };
  }

  /** Checkbox handler factory for amenities. */
  function onBool(key: BoolKey) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.currentTarget;
      setForm((s) => ({ ...s, [key]: checked }));
    };
  }

  /** Image field handler (by row index + key). */
  function onImageField(i: number, key: 'url' | 'alt') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.currentTarget.value;
      setForm((s) => {
        const images = s.images.slice();
        images[i] = { ...images[i], [key]: val };
        return { ...s, images };
      });
    };
  }

  /** Append a blank image row. */
  function addImageRow() {
    setForm((s) => ({ ...s, images: [...s.images, { url: '', alt: '' }] }));
  }

  /** Remove an image row (always keeps at least one row). */
  function removeImageRow(i: number) {
    setForm((s) => {
      const images = s.images.slice();
      images.splice(i, 1);
      return { ...s, images: images.length ? images : [{ url: '', alt: '' }] };
    });
  }

  /**
   * Validate and submit the form – create or update based on `editing`.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');

    // Validate images (URLs must be http/https if provided)
    const bad = form.images.find((img) => img.url.trim() && !/^https?:\/\//i.test(img.url.trim()));
    if (bad) return toast.error('All image URLs must start with http(s)');

    // Lat/Lng validation (both or neither; numeric; within range)
    const hasLat = form.lat.trim() !== '';
    const hasLng = form.lng.trim() !== '';
    if (hasLat !== hasLng) {
      return toast.error('Please provide both latitude and longitude (or neither).');
    }
    if (hasLat && hasLng) {
      const lat = Number(form.lat),
        lng = Number(form.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return toast.error('Latitude and Longitude must be numbers.');
      }
      if (lat < -90 || lat > 90) return toast.error('Latitude must be between -90 and 90.');
      if (lng < -180 || lng > 180) return toast.error('Longitude must be between -180 and 180.');
    }

    setBusy(true);
    try {
      // Normalize location strings (country/city)
      const canonCountry = normalizeCountry(form.country ?? null);
      const canonCity = normalizeCity(form.city ?? null);

      const payload = toVenueInput(form);
      payload.location = {
        ...(payload.location ?? {}),
        country: canonCountry ?? undefined,
        city: canonCity ?? undefined,
      };

      if (form.country && !canonCountry) toast('Unknown country removed');
      if (form.city && !canonCity) toast('Unknown city removed');

      if (!editing && (!payload.media || payload.media.length === 0)) {
        setBusy(false);
        return toast.error('Please add at least one image URL.');
      }

      if (editing) {
        await updateVenue(id!, payload);
        toast.success('Venue updated');
        setInitial(JSON.stringify(form));
      } else {
        await createVenue(payload);
        toast.success('Venue created');
        setForm(emptyForm);
        setInitial(JSON.stringify(emptyForm));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Delete the current venue after confirmation and return to profile.
   */
  async function handleDelete() {
    if (!editing) return;
    if (!confirm('Delete this venue? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteVenue(id!);
      toast.success('Venue deleted');
      navigate('/profile');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  const hasValidImage = form.images.some((i) => /^https?:\/\//i.test(i.url.trim()));
  const canSubmit = !busy && !!form.name.trim() && (editing || hasValidImage);

  return (
    <section className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-center text-2xl font-bold">
        {editing ? 'Edit venue' : 'Create venue'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic */}
        <div>
          <label className="form-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="field"
            value={form.name}
            onChange={onField('name')}
            required
          />
        </div>

        <div>
          <label className="form-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="field-textarea"
            rows={6}
            value={form.description}
            onChange={onField('description')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="price">
              Price (per night)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              className="field"
              value={form.price}
              onChange={onField('price')}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="maxGuests">
              Max guests
            </label>
            <input
              id="maxGuests"
              type="number"
              min={1}
              className="field"
              value={form.maxGuests}
              onChange={onField('maxGuests')}
            />
          </div>
        </div>

        {/* Images */}
        <fieldset className="rounded border border-border p-3">
          <legend className="text-sm font-semibold">Images</legend>

          <div className="space-y-3">
            {form.images.map((img, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                <input
                  className="field"
                  placeholder="Image URL (https://...)"
                  value={img.url}
                  onChange={onImageField(i, 'url')}
                  aria-label="Image URL"
                />
                <div className="flex gap-2">
                  <input
                    className="field flex-1"
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={onImageField(i, 'alt')}
                    aria-label="Alt text"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="dangerOutline"
                    onClick={() => removeImageRow(i)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addImageRow}
              disabled={form.images.length >= 12}
            >
              + Add image
            </Button>
          </div>
        </fieldset>

        {/* Amenities */}
        <fieldset className="rounded border border-border p-3">
          <legend className="text-sm font-semibold">Amenities</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.wifi} onChange={onBool('wifi')} /> Wifi
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.parking} onChange={onBool('parking')} /> Parking
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.breakfast} onChange={onBool('breakfast')} />{' '}
              Breakfast
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.pets} onChange={onBool('pets')} /> Pets
            </label>
          </div>
        </fieldset>

        {/* Location */}
        <details className="rounded border border-border p-3">
          <summary className="cursor-pointer text-sm font-semibold">Location</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              placeholder="Address"
              value={form.address}
              onChange={onField('address')}
              aria-label="Address"
            />
            <input
              className="field"
              placeholder="City"
              value={form.city}
              onChange={onField('city')}
              aria-label="City"
            />
            <input
              className="field"
              placeholder="ZIP"
              value={form.zip}
              onChange={onField('zip')}
              aria-label="ZIP code"
            />
            <input
              className="field"
              placeholder="Country"
              value={form.country}
              onChange={onField('country')}
              aria-label="Country"
            />
            <input
              className="field"
              placeholder="Continent"
              value={form.continent}
              onChange={onField('continent')}
              aria-label="Continent"
            />
            <input
              id="lat"
              type="number"
              step="any"
              inputMode="decimal"
              className="field"
              placeholder="Lat"
              value={form.lat}
              onChange={onField('lat')}
              aria-label="Latitude"
            />
            <input
              id="lng"
              type="number"
              step="any"
              inputMode="decimal"
              className="field"
              placeholder="Lng"
              value={form.lng}
              onChange={onField('lng')}
              aria-label="Longitude"
            />
          </div>
        </details>

        <div className="mt-6 flex items-center justify-end gap-3">
          {editing && (
            <Button type="button" variant="dangerOutline" onClick={handleDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={!canSubmit || busy}>
            {busy ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save changes' : 'Create venue'}
          </Button>
        </div>
      </form>
    </section>
  );
}
