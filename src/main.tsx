import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import App from '@/App';
import RootError from '@/pages/RootError';
import { RequireAuth, RequireManager } from '@/routes/guards';

import './index.css';

// ---- lazy page chunks ----
const HomePage = lazy(() => import('@/pages/HomePage'));
const VenueDetailPage = lazy(() => import('@/pages/VenueDetailPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const BookingsPage = lazy(() => import('@/pages/BookingsPage'));
const ManageVenuePage = lazy(() => import('@/pages/ManageVenuePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// small shared fallback
const Fallback = <div className="p-4 text-sm text-muted">Loading…</div>;
const withSuspense = (el: React.ReactElement) => <Suspense fallback={Fallback}>{el}</Suspense>;

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

      {
        element: <RequireAuth />,
        children: [
          { path: 'profile', element: withSuspense(<ProfilePage />) },
          { path: 'bookings', element: withSuspense(<BookingsPage />) },
        ],
      },
      {
        element: <RequireManager />,
        children: [
          { path: 'manage', element: withSuspense(<ManageVenuePage />) },
          { path: 'manage/:id', element: withSuspense(<ManageVenuePage />) },
          { path: 'venues/new', element: <Navigate to="/manage" replace /> },
        ],
      },

      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);

// enable thumbnail debug when ?debugthumbs is in the URL
if (new URLSearchParams(window.location.search).has('debugthumbs')) {
  (window as Window & { __debugThumbs?: boolean }).__debugThumbs = true;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
