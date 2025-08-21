import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

export function RequireAuth() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const loc = useLocation();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />;
}

export function RequireManager() {
  const isManager = useAuthStore((s) => s.isManager());
  const loc = useLocation();
  return isManager ? <Outlet /> : <Navigate to="/" replace state={{ from: loc }} />;
}
