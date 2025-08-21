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

      // optional: mirror token for buildHeaders()
      try {
        localStorage.setItem('token', d.accessToken);
      } catch {
        /* ignore */
      }

      // send venueManager to the store so the header can show (Manager)
      login({
        name: d.name,
        email: d.email,
        accessToken: d.accessToken,
        venueManager: !!d.venueManager,
        // include this only if your store's login signature accepts it:
        avatarUrl: d.avatar?.url ?? null,
      });

      await refreshVenueManager(d.name, d.accessToken);

      // If still false but email is stud.noroff.no, try to enable it
      const isStud = /@stud\.noroff\.no$/i.test(d.email);
      const current = useAuthStore.getState().user?.venueManager;

      if (isStud && current === false) {
        const ok = await setVenueManager(d.name, true, d.accessToken);
        if (ok) {
          useAuthStore.setState((s) => (s.user ? { user: { ...s.user, venueManager: true } } : s));
        }
      }

      try {
        const url = `${API_PROFILES}/${encodeURIComponent(d.name)}`;
        const profRes = await fetch(url, { headers: buildHeaders() });
        const prof = (await profRes.json().catch(() => ({}))) as {
          data?: { venueManager?: boolean };
        };

        if (prof?.data?.venueManager !== undefined) {
          useAuthStore.setState((s) => ({
            user: { ...s.user!, venueManager: !!prof.data!.venueManager },
          }));
        }
      } catch {
        /* ignore profile fetch issues */
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
