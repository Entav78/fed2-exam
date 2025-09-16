/** @file App entrypoint & router setup.
 *  - Creates the React Router tree (with error boundary).
 *  - Code-splits top-level pages via `React.lazy`.
 *  - Wraps lazy pages in a tiny `<Suspense>` fallback helper.
 *  - Adds simple route guards for auth/manager-only routes.
 */

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import App from '@/App';
import RootError from '@/pages/RootError';
import { RequireAuth, RequireManager } from '@/routes/guards';

import './index.css';

// ---- lazy page chunks ----
/** Lazily loaded route components (one chunk per page). */
const HomePage = lazy(() => import('@/pages/HomePage'));
const VenueDetailPage = lazy(() => import('@/pages/VenueDetailPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const BookingsPage = lazy(() => import('@/pages/BookingsPage'));
const ManageVenuePage = lazy(() => import('@/pages/ManageVenuePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Small, shared loading placeholder used by all lazy routes. */
const Fallback = <div className="p-4 text-sm text-muted">Loading…</div>;

/** Wrap a lazy element with Suspense + shared fallback. */
const withSuspense = (el: React.ReactElement) => <Suspense fallback={Fallback}>{el}</Suspense>;

/** App router definition: public pages, guarded sections, and 404. */
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RootError />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'venues/:id', element: withSuspense(<VenueDetailPage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'register', element: withSuspense(<RegisterPage />) },

      // Auth-only area
      {
        element: <RequireAuth />,
        children: [
          { path: 'profile', element: withSuspense(<ProfilePage />) },
          { path: 'bookings', element: withSuspense(<BookingsPage />) },
        ],
      },

      // Manager-only area
      {
        element: <RequireManager />,
        children: [
          { path: 'manage', element: withSuspense(<ManageVenuePage />) },
          { path: 'manage/:id', element: withSuspense(<ManageVenuePage />) },
          { path: 'venues/new', element: <Navigate to="/manage" replace /> },
        ],
      },

      // Catch-all: 404
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);

/** Dev helper: enable thumbnail overlay when `?debugthumbs` is present. */
if (new URLSearchParams(window.location.search).has('debugthumbs')) {
  (window as Window & { __debugThumbs?: boolean }).__debugThumbs = true;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
