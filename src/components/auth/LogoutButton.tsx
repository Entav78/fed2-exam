/** @file LogoutButton – logs the current user out and returns to the home page. */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

/**
 * Props for {@link LogoutButton}.
 */
type Props = {
  /** Optional extra classes to merge with the default button styles. */
  className?: string;
};

/**
 * LogoutButton
 *
 * Renders a button that:
 * 1) Calls the auth store's `logout`.
 * 2) Shows a success toast.
 * 3) Navigates to the home route (`/`).
 *
 * The button becomes temporarily disabled while the action is in progress.
 */
export default function LogoutButton({ className = '' }: Props) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [busy, setBusy] = useState(false);

  /**
   * Perform logout and navigate home. No-op if already busy.
   */
  async function handleLogout(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      logout();
      toast.success('Logged out');
      navigate('/');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Log out"
      aria-busy={busy}
      className={[
        'px-2 py-1 rounded hover:underline text-current',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--header-fg))/30]',
        className,
      ].join(' ')}
      disabled={busy}
    >
      {busy ? 'Logging out…' : 'Logout'}
    </button>
  );
}
