// src/components/profile/ProfileMediaEditor.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { updateProfileMedia, type UpdateProfileMediaBody } from '@/lib/api/profiles';
import { useAuthStore } from '@/store/authStore';

type Form = {
  avatarUrl: string;
  avatarAlt: string;
  bannerUrl: string;
  bannerAlt: string;
};

export default function ProfileMediaEditor() {
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<Form>({
    avatarUrl: user?.avatar?.url ?? '',
    avatarAlt: user?.avatar?.alt ?? '',
    bannerUrl: user?.banner?.url ?? '',
    bannerAlt: user?.banner?.alt ?? '',
  });

  const [initial, setInitial] = useState(() => JSON.stringify(form));
  const dirty = JSON.stringify(form) !== initial;

  if (!user) return null;

  // put this inside ProfileMediaEditor()
  const on = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // robust read, even if the synthetic event gets nulled
    const val = ((e.target as HTMLInputElement | null)?.value ?? '').toString();
    setForm((s) => ({ ...s, [key]: val }));
  };

  async function save() {
    const name = user?.name;
    if (!name) {
      toast.error('You must be logged in');
      return;
    }

    // URL validation
    if (form.avatarUrl && !/^https?:\/\//i.test(form.avatarUrl.trim())) {
      toast.error('Avatar URL must start with http(s)');
      return;
    }
    if (form.bannerUrl && !/^https?:\/\//i.test(form.bannerUrl.trim())) {
      toast.error('Banner URL must start with http(s)');
      return;
    }

    // Build body without nulls
    const body: UpdateProfileMediaBody = {};
    const avatarUrl = form.avatarUrl.trim();
    const bannerUrl = form.bannerUrl.trim();

    if (avatarUrl) body.avatar = { url: avatarUrl, alt: form.avatarAlt.trim() || name };
    if (bannerUrl) body.banner = { url: bannerUrl, alt: form.bannerAlt.trim() || name };

    if (!('avatar' in body) && !('banner' in body)) {
      toast.error('Nothing to save — add at least one image URL.');
      return;
    }

    setBusy(true);
    try {
      const updated = await updateProfileMedia(name, body);

      // Mirror avatar into auth store for header refresh
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, avatarUrl: updated.avatar?.url ?? null } } : s,
      );

      // Mark clean
      setInitial(JSON.stringify(form));
      toast.success('Profile media updated');
    } catch (e) {
      toast.error((e as Error).message ?? 'Could not update profile media');
    } finally {
      setBusy(false);
    }
  } // <-- make sure save() ends here

  const canSave =
    dirty && !busy && (form.avatarUrl.trim().length > 0 || form.bannerUrl.trim().length > 0);

  return (
    <section className="rounded border border-border-light bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Profile images</h2>

      {/* Banner */}
      <div className="mb-4 grid items-start gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="bannerUrl" className="form-label">
            Banner URL
          </label>
          <input
            id="bannerUrl"
            className="input-field"
            placeholder="https://…"
            value={form.bannerUrl}
            onChange={on('bannerUrl')}
          />
          <input
            className="input-field mt-2"
            placeholder="Banner alt text"
            value={form.bannerAlt}
            onChange={on('bannerAlt')}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="overflow-hidden rounded border border-border-light">
            {form.bannerUrl ? (
              <img
                src={form.bannerUrl}
                alt={form.bannerAlt || 'Banner preview'}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="grid h-40 w-full place-items-center text-sm text-muted">
                No banner
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="grid items-start gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="avatarUrl" className="form-label">
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            className="input-field"
            placeholder="https://…"
            value={form.avatarUrl}
            onChange={on('avatarUrl')}
          />
          <input
            className="input-field mt-2"
            placeholder="Avatar alt text"
            value={form.avatarAlt}
            onChange={on('avatarAlt')}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-border-light">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt={form.avatarAlt || 'Avatar preview'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-muted">
                  No avatar
                </div>
              )}
            </div>
            <p className="text-sm text-muted">Tip: square images look best for avatars.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={save} disabled={!canSave}>
          {busy ? 'Saving…' : 'Save'}
        </Button>

        <Button
          type="button"
          onClick={() => setForm((s) => ({ ...s, avatarUrl: '', avatarAlt: '' }))}
          className="border border-border-light"
        >
          Clear avatar
        </Button>

        <Button
          type="button"
          onClick={() => setForm((s) => ({ ...s, bannerUrl: '', bannerAlt: '' }))}
          className="border border-border-light"
        >
          Clear banner
        </Button>
      </div>
    </section>
  );
}
