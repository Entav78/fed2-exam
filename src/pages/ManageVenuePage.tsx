// src/pages/ManageVenuePage.tsx
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
import { useAuthStore } from '@/store/authStore';

type FormState = {
  name: string;
  description: string;
  price: number | string;
  maxGuests: number | string;
  // ✅ multiple images
  images: Array<{ url: string; alt: string }>;

  // amenities/meta
  wifi: boolean;
  parking: boolean;
  breakfast: boolean;
  pets: boolean;

  // location
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
  images: [{ url: '', alt: '' }], // start with one row

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

// For strongly-typed checkbox handler:
type BoolKey = 'wifi' | 'parking' | 'breakfast' | 'pets';

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

        if (v.owner?.name && currentName && v.owner.name !== currentName) {
          toast.error('You can only edit your own venue');
          navigate('/profile');
          return;
        }

        const f = fromVenueToForm(v);
        setForm(f);
        setInitial(JSON.stringify(f)); // ✅ snapshot here
      } catch (e) {
        toast.error((e as Error).message ?? 'Could not load venue');
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id, currentName, navigate]);

  const dirty = initial !== null && JSON.stringify(form) !== initial;

  // ✅ separate effect just for beforeunload
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = ''; // required for some browsers
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  if (!isManager) return <p className="text-danger">Managers only.</p>;
  if (loading) return <p>Loading…</p>;

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

  function toVenueInput(f: FormState): VenueInput {
    const media = f.images
      .map(({ url, alt }) => ({ url: url.trim(), alt: alt.trim() }))
      .filter((m) => m.url && /^https?:\/\//i.test(m.url)); // keep http(s) only

    const location = {
      address: f.address.trim() || undefined,
      city: f.city.trim() || undefined,
      zip: f.zip.trim() || undefined,
      country: f.country.trim() || undefined,
      continent: f.continent.trim() || undefined,
      lat: f.lat ? Number(f.lat) : undefined,
      lng: f.lng ? Number(f.lng) : undefined,
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

  function onField<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.currentTarget.value; // keep as string; cast on submit
      setForm((s) => ({ ...s, [key]: val }));
    };
  }

  function onBool(key: BoolKey) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.currentTarget; // read immediately
      setForm((s) => ({ ...s, [key]: checked }));
    };
  }

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
  function addImageRow() {
    setForm((s) => ({ ...s, images: [...s.images, { url: '', alt: '' }] }));
  }
  function removeImageRow(i: number) {
    setForm((s) => {
      const images = s.images.slice();
      images.splice(i, 1);
      return { ...s, images: images.length ? images : [{ url: '', alt: '' }] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');

    // Validate images (optional: require http(s) if provided)
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
      const payload = toVenueInput(form); // images[] -> media[]
      if (!editing && (!payload.media || payload.media.length === 0)) {
        setBusy(false);
        return toast.error('Please add at least one image URL.');
      }

      toast.success(editing ? 'Venue updated' : 'Venue created');

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
            className="input-field"
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
            className="input-field"
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
              className="input-field"
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
              className="input-field"
              value={form.maxGuests}
              onChange={onField('maxGuests')}
            />
          </div>
        </div>

        {/* Images */}
        <fieldset className="rounded border border-border-light p-3">
          <legend className="text-sm font-semibold">Images</legend>

          <div className="space-y-3">
            {form.images.map((img, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-field"
                  placeholder="Image URL (https://...)"
                  value={img.url}
                  onChange={onImageField(i, 'url')}
                />
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={onImageField(i, 'alt')}
                  />
                  <button
                    type="button"
                    onClick={() => removeImageRow(i)}
                    className="rounded border border-border-light px-3 py-1 text-sm"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={addImageRow}
              disabled={form.images.length >= 12}
              className={`rounded border border-border-light px-3 py-1 text-sm ${
                form.images.length >= 12 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              + Add image
            </button>
          </div>
        </fieldset>

        {/* Amenities */}
        <fieldset className="rounded border border-border-light p-3">
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
        <details className="rounded border border-border-light p-3">
          <summary className="cursor-pointer text-sm font-semibold">Location</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className="input-field"
              placeholder="Address"
              value={form.address}
              onChange={onField('address')}
            />
            <input
              className="input-field"
              placeholder="City"
              value={form.city}
              onChange={onField('city')}
            />
            <input
              className="input-field"
              placeholder="ZIP"
              value={form.zip}
              onChange={onField('zip')}
            />
            <input
              className="input-field"
              placeholder="Country"
              value={form.country}
              onChange={onField('country')}
            />
            <input
              className="input-field"
              placeholder="Continent"
              value={form.continent}
              onChange={onField('continent')}
            />
            <input
              id="lat"
              type="number"
              step="any"
              inputMode="decimal"
              className="input-field"
              placeholder="Lat"
              value={form.lat}
              onChange={onField('lat')}
            />
            <input
              id="lng"
              type="number"
              step="any"
              inputMode="decimal"
              className="input-field"
              placeholder="Lng"
              value={form.lng}
              onChange={onField('lng')}
            />
          </div>
        </details>

        <div className="mt-6 flex items-center justify-end gap-3">
          {editing && (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="border border-border-light"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          )}
          <Button type="submit" disabled={!canSubmit}>
            {busy ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save changes' : 'Create venue'}
          </Button>
        </div>
      </form>
    </section>
  );
}
