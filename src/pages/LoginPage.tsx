/** @file LoginPage – email/password login with safe redirect, profile fetch, and auth store sync. */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { API_PROFILES, buildHeaders, getLoginUrl } from '@/lib/api/constants';
import { useAuthStore } from '@/store/authStore';

const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

type ApiErrorJSON = { errors?: Array<{ message?: string }>; message?: string };
type LoginSuccess = {
  data?: {
    name: string;
    email: string;
    accessToken: string;
    venueManager?: boolean;
    avatar?: { url?: string; alt?: string };
  };
};
type MeProfile = {
  name: string;
  email: string;
  venueManager?: boolean;
  avatar?: { url?: string; alt?: string } | null;
  banner?: { url?: string; alt?: string } | null;
};

/**
 * Extract a readable error message from an API response JSON.
 * Falls back to a generic string if none is present.
 */
function extractApiError(json: unknown, fallback = 'Login failed') {
  const j = json as ApiErrorJSON;
  return j.errors?.[0]?.message ?? j.message ?? fallback;
}

/**
 * Page component: handles credential submission, validates redirect target,
 * fetches the profile, and hydrates the auth store.
 */
export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  // Validate and normalize ?redirect=… to a same-site, non-login path.
  const redirect = (() => {
    const raw = new URLSearchParams(location.search).get('redirect') || '/';
    if (
      !raw.startsWith('/') ||
      raw.startsWith('//') ||
      raw.includes('://') ||
      raw.startsWith('/login') ||
      raw.startsWith('/register')
    ) {
      return '/';
    }
    return raw;
  })();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Submit credentials, then fetch profile and store auth on success. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1) Login
      const res = await fetch(getLoginUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'X-Noroff-API-Key': API_KEY } : {}),
        },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiErrorJSON & LoginSuccess;
      if (!res.ok) throw new Error(extractApiError(json));

      const d = json.data;
      if (!d?.accessToken || !d?.email || !d?.name) throw new Error('Invalid login response');

      try {
        localStorage.setItem('token', d.accessToken);
      } catch {
        /* ignore storage errors */
      }

      // 2) Fetch profile
      const meUrl = `${API_PROFILES}/${encodeURIComponent(d.name)}`;
      const meRes = await fetch(meUrl, { headers: buildHeaders() });
      if (!meRes.ok) {
        const j = await meRes.json().catch(() => ({}));
        const msg = j?.errors?.[0]?.message ?? j?.message ?? 'Could not load profile';
        throw new Error(msg);
      }

      const meJson = await meRes.json().catch(() => ({}));
      const me = meJson?.data as MeProfile | undefined;
      if (!me?.name || !me?.email) throw new Error('Profile response missing required fields');

      const toMedia = (m?: { url?: string; alt?: string } | null) =>
        m?.url ? { url: m.url, alt: m.alt ?? me.name } : null;

      // 3) Hydrate auth store
      login({
        name: me.name,
        email: me.email,
        accessToken: d.accessToken,
        venueManager: !!me.venueManager,
        avatarUrl: me.avatar?.url ?? null,
        avatar: toMedia(me.avatar),
        banner: toMedia(me.banner),
      });

      toast.success('Logged in successfully!');
      // Clear sensitive state
      setPassword('');
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = email.trim() !== '' && password.trim() !== '';
  const errorId = error ? 'login-error' : undefined;

  return (
    <section className="max-w-md mx-auto p-4">
      <div className="form-container">
        <h1 className="heading-xl">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@stud.noroff.no"
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId}
            />
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant={canSubmit ? 'primary' : 'outline'}
            size="lg"
            className="w-full"
            isLoading={isLoading}
            disabled={!canSubmit || isLoading}
          >
            Login
          </Button>
        </form>
      </div>
    </section>
  );
}
