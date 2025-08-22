// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from '@/App';
import BookingsPage from '@/pages/BookingsPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ManageVenuePage from '@/pages/ManageVenuePage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProfilePage from '@/pages/ProfilePage';
import RegisterPage from '@/pages/RegisterPage';
import RootError from '@/pages/RootError';
import VenueDetailPage from '@/pages/VenueDetailPage';
import { RequireAuth, RequireManager } from '@/routes/guards';

import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // keeps Header/Footer via <Outlet/>
    errorElement: <RootError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'venues/:id', element: <VenueDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // protected routes (still under App layout)
      {
        element: <RequireAuth />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'bookings', element: <BookingsPage /> },
        ],
      },
      {
        element: <RequireManager />, // managers only
        children: [
          { path: 'manage', element: <ManageVenuePage /> },
          { path: 'manage/:id', element: <ManageVenuePage /> },
          { path: 'venues/new', element: <ManageVenuePage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
