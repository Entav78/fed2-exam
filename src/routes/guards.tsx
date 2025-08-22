// src/routes/guards.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

export function RequireAuth() {
  const loggedIn = useAuthStore((s) => s.isLoggedIn());
  const loc = useLocation();
  if (!loggedIn) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}

export function RequireManager() {
  const role = useAuthStore((s) => s.role());
  const loc = useLocation();
  if (role !== 'manager') return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}
