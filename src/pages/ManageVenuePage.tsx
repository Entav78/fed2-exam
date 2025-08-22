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
  // single image; mapped to media[] on submit
  imageUrl: string;
  imageAlt: string;

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
  lat: string; // keep as string in inputs; cast to number on submit
  lng: string;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  maxGuests: 1,
  imageUrl: '',
  imageAlt: '',

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
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const navigate = useNavigate();

  const isManager = useAuthStore((s) => s.isManager());
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        setLoading(true);
        const v = await getVenueById(id!, { owner: true, bookings: false });
        setForm(fromVenueToForm(v));
      } catch (e) {
        toast.error((e as Error).message ?? 'Could not load venue');
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id]);

  if (!isManager) return <p className="text-danger">Managers only.</p>;
  if (loading) return <p>Loading…</p>;

  function fromVenueToForm(v: Venue): FormState {
    return {
      name: v.name ?? '',
      description: v.description ?? '',
      price: v.price ?? '',
      maxGuests: v.maxGuests ?? 1,
      imageUrl: v.media?.[0]?.url ?? '',
      imageAlt: v.media?.[0]?.alt ?? '',

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
    const media = f.imageUrl
      ? [{ url: f.imageUrl.trim(), alt: f.imageAlt.trim() || f.name.trim() }]
      : [];

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
      meta: {
        wifi: f.wifi,
        parking: f.parking,
        breakfast: f.breakfast,
        pets: f.pets,
      },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');

    setBusy(true);
    try {
      const payload = toVenueInput(form);
      const saved = editing ? await updateVenue(id!, payload) : await createVenue(payload);
      toast.success(editing ? 'Venue updated' : 'Venue created');
      navigate(`/venues/${saved.id}`);
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

        {/* Image */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="imageUrl">
              Image URL
            </label>
            <input
              id="imageUrl"
              className="input-field"
              value={form.imageUrl}
              onChange={onField('imageUrl')}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="imageAlt">
              Image alt
            </label>
            <input
              id="imageAlt"
              className="input-field"
              value={form.imageAlt}
              onChange={onField('imageAlt')}
            />
          </div>
        </div>

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
              className="input-field"
              placeholder="Lat"
              value={form.lat}
              onChange={onField('lat')}
            />
            <input
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
          <Button type="submit" disabled={busy}>
            {busy ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save changes' : 'Create venue'}
          </Button>
        </div>
      </form>
    </section>
  );
}
