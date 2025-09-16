/** @file ProfileMediaEditor – preview and update a user's banner and avatar media. */

import { type ReactNode, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { updateProfileMedia, type UpdateProfileMediaBody } from '@/lib/api/profiles';
import { useAuthStore } from '@/store/authStore';
import { makeSrcSet } from '@/utils/img';
import { optimizeRemoteImage } from '@/utils/optimizeRemoteImage';

/** Intrinsic banner width (px). */
const COVER_W = 1200;
/** Intrinsic banner height (px). */
const COVER_H = 400;
/** Intrinsic avatar width (px). */
const AVATAR_W = 96;
/** Intrinsic avatar height (px). */
const AVATAR_H = 96;

/** Local form state for media fields. */
type Form = {
  avatarUrl: string;
  avatarAlt: string;
  bannerUrl: string;
  bannerAlt: string;
};

/**
 * Collapsible panel used for the banner/avatar editors.
 * @param label Section label (e.g., "Banner" or "Avatar")
 * @param children Form controls to render inside the panel
 * @param defaultOpen Whether the panel starts open
 */
function Collapsible({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `${label.replace(/\s+/g, '-').toLowerCase()}-panel`;

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex items-center gap-2"
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M7 5l6 5-6 5V5z" />
        </svg>
        <span>
          {open ? 'Hide' : 'Edit'} {label.toLowerCase()}
        </span>
      </Button>

      <div id={id} className={open ? 'mt-3 grid gap-2 sm:grid-cols-3' : 'hidden'}>
        {children}
      </div>
    </div>
  );
}

/**
 * ProfileMediaEditor
 *
 * - Shows live previews of the banner (LCP on this route) and avatar.
 * - Validates absolute http(s) URLs before save.
 * - Persists via `updateProfileMedia` and mirrors changes into the auth store.
 * - Uses intrinsic `width/height` and responsive `srcSet/sizes` for the banner.
 */
export default function ProfileMediaEditor() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.isManager());
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

  /** Input change handler factory for the form fields. */
  const on = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = ((e.target as HTMLInputElement | null)?.value ?? '').toString();
    setForm((s) => ({ ...s, [key]: val }));
  };

  /** Persist avatar/banner URLs and alt text to the profile, mirroring to the auth store. */
  async function save() {
    const name = user?.name;
    if (!name) {
      toast.error('You must be logged in');
      return;
    }

    if (form.avatarUrl && !/^https?:\/\//i.test(form.avatarUrl.trim())) {
      toast.error('Avatar URL must start with http(s)');
      return;
    }
    if (form.bannerUrl && !/^https?:\/\//i.test(form.bannerUrl.trim())) {
      toast.error('Banner URL must start with http(s)');
      return;
    }

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

      useAuthStore.setState((s) =>
        s.user
          ? {
              user: {
                ...s.user,
                avatarUrl: updated.avatar?.url ?? null,
                avatar: updated.avatar ?? null,
                banner: updated.banner ?? null,
              },
            }
          : s,
      );

      setInitial(JSON.stringify(form));
      toast.success('Profile media updated');
    } catch (e) {
      toast.error((e as Error).message ?? 'Could not update profile media');
    } finally {
      setBusy(false);
    }
  }

  const canSave =
    dirty && !busy && (form.avatarUrl.trim().length > 0 || form.bannerUrl.trim().length > 0);

  return (
    <section className="rounded border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Profile images</h2>

      <div
        className="overflow-hidden rounded border border-border"
        style={{ aspectRatio: '3 / 1' }}
      >
        <div className="relative h-full w-full">
          {form.bannerUrl ? (
            <img
              src={optimizeRemoteImage(form.bannerUrl, { width: COVER_W, height: COVER_H })}
              srcSet={makeSrcSet(form.bannerUrl, [480, 640, 768, 960, 1200], (w) =>
                Math.round(w * (COVER_H / COVER_W)),
              )}
              sizes="(min-width:1024px) 1024px, 100vw"
              alt={form.bannerAlt || 'Banner preview'}
              width={COVER_W}
              height={COVER_H}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-muted">
              No banner
            </div>
          )}
        </div>
      </div>

      <Collapsible label="Banner" defaultOpen={!form.bannerUrl}>
        <div className="sm:col-span-2">
          <label htmlFor="bannerUrl" className="form-label">
            Banner URL
          </label>
          <input
            id="bannerUrl"
            className="field"
            placeholder="https://…"
            value={form.bannerUrl}
            onChange={on('bannerUrl')}
          />
        </div>
        <div>
          <label htmlFor="bannerAlt" className="form-label">
            Alt text
          </label>
          <input
            id="bannerAlt"
            className="field"
            placeholder="Describe the image"
            value={form.bannerAlt}
            onChange={on('bannerAlt')}
          />
        </div>
      </Collapsible>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-24 w-24 overflow-hidden rounded-full border border-border">
          {form.avatarUrl ? (
            <img
              src={optimizeRemoteImage(form.avatarUrl, { width: AVATAR_W, height: AVATAR_H })}
              alt={form.avatarAlt || 'Avatar preview'}
              width={AVATAR_W}
              height={AVATAR_H}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-muted">
              No avatar
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold">{user!.name}</span>
            <span className="rounded-full bg-[rgb(var(--fg))/0.06] px-2 py-0.5 text-xs">
              {isManager ? 'Manager' : 'Customer'}
            </span>
          </div>
          {user?.email && (
            <a
              href={`mailto:${user.email}`}
              className="text-sm text-[rgb(var(--fg))/0.8] hover:underline"
            >
              {user.email}
            </a>
          )}
        </div>
      </div>

      <Collapsible label="Avatar" defaultOpen={!form.avatarUrl}>
        <div className="sm:col-span-2">
          <label htmlFor="avatarUrl" className="form-label">
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            className="field"
            placeholder="https://…"
            value={form.avatarUrl}
            onChange={on('avatarUrl')}
          />
        </div>
        <div>
          <label htmlFor="avatarAlt" className="form-label">
            Alt text
          </label>
          <input
            id="avatarAlt"
            className="field"
            placeholder="Describe the image"
            value={form.avatarAlt}
            onChange={on('avatarAlt')}
          />
        </div>
        <p className="text-sm text-muted">Tip: square images look best for avatars.</p>
      </Collapsible>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant={canSave ? 'primary' : 'outline'}
          disabled={!canSave || busy}
          isLoading={busy}
          onClick={save}
        >
          Save
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setForm((s) => ({ ...s, avatarUrl: '', avatarAlt: '' }))}
          disabled={!form.avatarUrl.trim()}
        >
          Clear avatar
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setForm((s) => ({ ...s, bannerUrl: '', bannerAlt: '' }))}
          disabled={!form.bannerUrl.trim()}
        >
          Clear banner
        </Button>
      </div>
    </section>
  );
}
