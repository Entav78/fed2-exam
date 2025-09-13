import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { createVenue } from '@/lib/api/venues';

export default function NewVenuePage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [maxGuests, setMaxGuests] = useState<number>(2);
  const [imageUrl, setImageUrl] = useState('');
  const [wifi, setWifi] = useState(false);
  const [parking, setParking] = useState(false);
  const [breakfast, setBreakfast] = useState(false);
  const [pets, setPets] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    setBusy(true);
    try {
      const venue = await createVenue({
        name: name.trim(),
        price: Math.max(0, Number(price) || 0),
        maxGuests: Math.max(1, Number(maxGuests) || 1),
        media: imageUrl ? [{ url: imageUrl }] : [],
        meta: { wifi, parking, breakfast, pets },
      });
      toast.success('Venue created');
      navigate(`/venues/${venue.id}`);
    } catch (e) {
      toast.error((e as Error).message ?? 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">New venue</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded border border-border bg-card p-4">
        <label className="block">
          <span className="form-label">Name</span>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Price (NOK/night)</span>
            <input
              className="field"
              type="number"
              value={price}
              onChange={(e) => setPrice(+e.target.value)}
            />
          </label>
          <label className="block">
            <span className="form-label">Max guests</span>
            <input
              className="field"
              type="number"
              value={maxGuests}
              onChange={(e) => setMaxGuests(+e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="form-label">Image URL</span>
          <input
            className="field"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>

        <fieldset className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} />{' '}
            Wifi
          </label>
          <label className="text-sm">
            <input
              type="checkbox"
              checked={parking}
              onChange={(e) => setParking(e.target.checked)}
            />{' '}
            Parking
          </label>
          <label className="text-sm">
            <input
              type="checkbox"
              checked={breakfast}
              onChange={(e) => setBreakfast(e.target.checked)}
            />{' '}
            Breakfast
          </label>
          <label className="text-sm">
            <input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} />{' '}
            Pets
          </label>
        </fieldset>

        <div className="flex gap-3">
          <button
            disabled={busy}
            className={`rounded bg-brand px-4 py-2 text-white ${busy ? 'opacity-50' : ''}`}
          >
            {busy ? 'Saving…' : 'Create venue'}
          </button>
          <button
            type="button"
            className="rounded border border-border px-4 py-2"
            onClick={() => history.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
