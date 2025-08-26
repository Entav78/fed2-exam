import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { API_PROFILES } from '@/lib/api/constants';
import { buildHeaders } from '@/lib/api/constants';
import { getLoginUrl } from '@/lib/api/constants';
import { refreshVenueManager, setVenueManager } from '@/lib/api/profiles';
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

function extractApiError(json: unknown, fallback = 'Login failed') {
  const j = json as ApiErrorJSON;
  return j.errors?.[0]?.message ?? j.message ?? fallback;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(getLoginUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'X-Noroff-API-Key': API_KEY } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json().catch(() => ({}))) as ApiErrorJSON & LoginSuccess;

      if (!res.ok) {
        throw new Error(extractApiError(json));
      }

      const d = json.data;
      if (!d?.accessToken || !d?.email || !d?.name) {
        throw new Error('Invalid login response');
      }

      // 1) Make the token available to buildHeaders()
      try {
        localStorage.setItem('token', d.accessToken);
      } catch {
        /* ignore */
      }

      const meUrl = `${API_PROFILES}/${encodeURIComponent(d.name)}`;
      const meRes = await fetch(meUrl, { headers: buildHeaders() });
      if (!meRes.ok) {
        const j = await meRes.json().catch(() => ({}));
        const msg = j?.errors?.[0]?.message ?? j?.message ?? 'Could not load profile';
        throw new Error(msg);
      }

      const meJson = await meRes.json().catch(() => ({}));
      const me = meJson?.data as MeProfile | undefined;

      if (!me?.name || !me?.email) {
        throw new Error('Profile response missing required fields');
      }

      const toMedia = (m?: { url?: string; alt?: string } | null) =>
        m?.url ? { url: m.url, alt: m.alt ?? me.name } : null;
      // 3) Put canonical profile into the store
      login({
        name: me.name,
        email: me.email,
        accessToken: d.accessToken,
        venueManager: !!me.venueManager,
        avatarUrl: me.avatar?.url ?? null,
        avatar: toMedia(me.avatar), // Media | null
        banner: toMedia(me.banner),
      });

      // 4) Keep your venueManager refresh/enabling logic
      await refreshVenueManager(me.name);

      // If still false but email is stud.noroff.no, try to enable it
      const isStud = /@stud\.noroff\.no$/i.test(me.email);
      const current = useAuthStore.getState().user?.venueManager;
      if (isStud && current === false) {
        const ok = await setVenueManager(me.name, true);
        if (ok) {
          useAuthStore.setState((s) => (s.user ? { user: { ...s.user, venueManager: true } } : s));
        }
      }

      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto p-4">
      <div className="form-container">
        <h1 className="heading-xl">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@stud.noroff.no"
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
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button type="submit" variant="form" disabled={isLoading} className="w-full">
            {isLoading ? '🔄 Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
