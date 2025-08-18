import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';

import HomePage from '@/pages/HomePage';
import VenueDetailPage from '@/pages/VenueDetailPage';
import RootError from '@/pages/RootError';
import NotFoundPage from '@/pages/NotFoundPage';

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
  </React.StrictMode>
);
