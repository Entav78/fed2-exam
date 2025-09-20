/** @file RegisterPage – account sign-up with optional “Venue Manager” flag.
 *  Enforces @stud.noroff.no for Venue Managers and shows friendly API errors.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { getRegisterUrl } from '@/lib/api/constants';

const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

type ApiErrorJSON = { errors?: Array<{ message?: string }>; message?: string };

/** Extract a readable error message from the API response shape. */
function extractApiError(json: unknown, fallback = 'Registration failed') {
  const j = json as ApiErrorJSON;
  return j?.errors?.[0]?.message ?? j?.message ?? fallback;
}

/** Venue Managers must use a Noroff student address. */
function isNoroffEmail(email: string) {
  // allows @stud.noroff.no and @noroff.no
  return /@(?:stud\.)?noroff\.no$/i.test(email.trim());
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

    const nameT = name.trim();
    const emailT = email.trim();

    if (venueManager && !isNoroffEmail(email)) {
      const msg = 'Venue Managers must use a Noroff email (@stud.noroff.no or @noroff.no).';
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
      const res = await fetch(getRegisterUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'X-Noroff-API-Key': API_KEY } : {}),
        },
        body: JSON.stringify({ name: nameT, email: emailT, password, venueManager }),
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

  const canRegister =
    name.trim() !== '' && email.trim() !== '' && password.trim() !== '' && password === confirm;

  return (
    <section className="mx-auto max-w-md p-4">
      <div className="form-container">
        <h1 className="heading-xl">Create an account</h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="form-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
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
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@stud.noroff.no"
            />
            <p className="mt-1 text-xs text-muted">
              Venue managers must use a <span className="font-medium">@stud.noroff.no</span> or{' '}
              <span className="font-medium">@noroff.no</span> email.
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
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
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
                className="field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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

          {error && (
            <p className="text-danger text-sm" role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant={canRegister ? 'primary' : 'outline'}
            size="lg"
            className="w-full"
            isLoading={isLoading}
            disabled={!canRegister || isLoading}
          >
            Register
          </Button>
        </form>
      </div>
    </section>
  );
}
