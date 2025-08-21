import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <button
      className={`underline hover:opacity-80 ${className}`}
      onClick={() => {
        logout();
        toast.success('Logged out');
        navigate('/');
      }}
    >
      Logout
    </button>
  );
}
