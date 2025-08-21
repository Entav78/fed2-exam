import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';

// You can replace with your constants if you prefer
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://v2.api.noroff.dev';
const REGISTER_URL = `${API_BASE}/auth/register`;
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

type ApiErrorJSON = { errors?: Array<{ message?: string }>; message?: string };
function extractApiError(json: unknown, fallback = 'Registration failed') {
  const j = json as ApiErrorJSON;
  return j.errors?.[0]?.message ?? j.message ?? fallback;
}

function isNoroffStudentEmail(email: string) {
  return /@stud\.noroff\.no$/i.test(email.trim());
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [venueManager, setVenueManager] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (venueManager && !isNoroffStudentEmail(email)) {
      const msg = 'Venue Managers must use a @stud.noroff.no email.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password !== confirm) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'X-Noroff-API-Key': API_KEY } : {}),
        },
        body: JSON.stringify({ name, email, password, venueManager }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiError(json));

      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md p-4">
      <div className="form-container">
        <h1 className="heading-xl">Create an account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@stud.noroff.no"
            />
            <p className="mt-1 text-xs text-muted">
              Venue managers must use a <span className="font-medium">@stud.noroff.no</span> email.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                className="input-field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={venueManager}
              onChange={(e) => setVenueManager(e.target.checked)}
            />
            I am a Venue Manager
          </label>

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button
            type="submit"
            className={`w-full rounded bg-brand px-4 py-2 text-white ${isLoading ? 'opacity-50' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Registering…' : 'Register'}
          </Button>
        </form>
      </div>
    </section>
  );
}
