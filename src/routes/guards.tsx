/** @file Route guards for protected sections of the app.
 * Redirects to `/login` when access is denied and preserves the
 * current location in `state.from` for post-login return.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

/**
 * Guards a route tree so only authenticated users can access it.
 *
 * @example
 * <Route element={<RequireAuth />}>
 *   <Route path="/profile" element={<ProfilePage />} />
 * </Route>
 */
export function RequireAuth() {
  const loggedIn = useAuthStore((s) => s.isLoggedIn());
  const loc = useLocation();
  if (!loggedIn) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}

/**
 * Guards a route tree so only users with the "manager" role can access it.
 *
 * @example
 * <Route element={<RequireManager />}>
 *   <Route path="/manage" element={<ManageVenuePage />} />
 * </Route>
 */
export function RequireManager() {
  const role = useAuthStore((s) => s.role());
  const loc = useLocation();
  if (role !== 'manager') return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}
