import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

type Props = { className?: string };

export default function LogoutButton({ className = '' }: Props) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
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
      className={[
        // match your header link look
        'px-2 py-1 rounded hover:underline text-current',
        // visible keyboard focus (uses header fg color)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--header-fg))/30]',
        className,
      ].join(' ')}
      disabled={busy}
    >
      {busy ? 'Logging out…' : 'Logout'}
    </button>
  );
}
