import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// protected pages (stub if not built yet)
import BookingsPage from '@/pages/BookingsPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ManageVenuesPage from '@/pages/ManageVenuesPage';
import NewVenuePage from '@/pages/NewVenuePage';
import NotFoundPage from '@/pages/NotFoundPage';
import RegisterPage from '@/pages/RegisterPage';
import RootError from '@/pages/RootError';
import VenueDetailPage from '@/pages/VenueDetailPage';
// guards
import { RequireAuth, RequireManager } from '@/routes/guards';

import App from './App';

import './index.css';
// 3rd-party CSS first, then your Tailwind
import 'react-day-picker/dist/style.css';
import 'leaflet/dist/leaflet.css';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RootError />, // render on thrown/loader errors
    children: [
      { index: true, element: <HomePage /> },
      { path: 'venues/:id', element: <VenueDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> }, // catch-all under /
    ],
  },

  {
    element: <RequireAuth />, // logged-in only
    children: [{ path: 'bookings', element: <BookingsPage /> }],
  },
  {
    element: <RequireManager />, // managers only
    children: [
      { path: 'manage', element: <ManageVenuesPage /> },
      { path: 'venues/new', element: <NewVenuePage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
