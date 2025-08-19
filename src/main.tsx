import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import RootError from '@/pages/RootError';
import VenueDetailPage from '@/pages/VenueDetailPage';

import App from './App';

import 'leaflet/dist/leaflet.css';
import './index.css';

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <RootError />, // optional but nice
    children: [
      { index: true, element: <HomePage /> },
      { path: 'venues/:id', element: <VenueDetailPage /> },
      { path: '*', element: <NotFoundPage /> }, // optional 404
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
