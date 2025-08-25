// src/components/profile/ProfileMediaEditor.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { updateProfileMedia } from '@/lib/api/profiles';
import { useAuthStore } from '@/store/authStore';
import type { Media } from '@/types/common';

type Form = {
  avatarUrl: string;
  avatarAlt: string;
  bannerUrl: string;
  bannerAlt: string;
};

function isHttp(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

export default function ProfileMediaEditor() {
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  // Prefill from current user (defensive: optional chaining)
  const [form, setForm] = useState<Form>({
    avatarUrl: user?.avatar?.url ?? '',
    avatarAlt: user?.avatar?.alt ?? '',
    bannerUrl: user?.banner?.url ?? '',
    bannerAlt: user?.banner?.alt ?? '',
  });

  if (!user?.name) return null;

  const on = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [key]: e.currentTarget.value }));

  async function save() {
    // validate (allow empty, but if provided must be http(s))
    if (form.avatarUrl && !isHttp(form.avatarUrl)) {
      return toast.error('Avatar URL must start with http(s)');
    }
    if (form.bannerUrl && !isHttp(form.bannerUrl)) {
      return toast.error('Banner URL must start with http(s)');
    }

    const avatar: Media | null = form.avatarUrl
      ? { url: form.avatarUrl.trim(), alt: form.avatarAlt.trim() }
      : null;

    const banner: Media | null = form.bannerUrl
      ? { url: form.bannerUrl.trim(), alt: form.bannerAlt.trim() }
      : null;

    setBusy(true);
    try {
      const updated = await updateProfileMedia(user.name, { avatar, banner });
      // update local store so header/profile reflect new images immediately
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, avatar: updated.avatar, banner: updated.banner } : s.user,
      }));
      toast.success('Profile images updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update profile');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded border border-border-light bg-card p-4">
      <h2 className="text-lg font-semibold mb-3">Profile images</h2>

      {/* Banner */}
      <div className="grid gap-3 sm:grid-cols-3 items-start mb-4">
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
          <div className="rounded border border-border-light overflow-hidden">
            {form.bannerUrl ? (
              <img
                src={form.bannerUrl}
                alt={form.bannerAlt || 'Banner preview'}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-muted grid place-items-center text-sm text-muted">
                No banner
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="grid gap-3 sm:grid-cols-3 items-start">
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
            <div className="h-20 w-20 rounded-full overflow-hidden border border-border-light">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt={form.avatarAlt || 'Avatar preview'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted grid place-items-center text-xs text-muted">
                  No avatar
                </div>
              )}
            </div>
            <p className="text-sm text-muted">Tip: square images look best for avatars.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </section>
  );
}
