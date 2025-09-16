/** @file App.tsx – root application shell (header, routed content, footer, global toaster).
 *
 * Responsibilities:
 * - Wraps all routes with a common layout.
 * - Exposes a “Skip to content” link for accessibility.
 * - Hydrates the venueManager flag shortly after mount (best-effort).
 * - Mounts the global toast <Toaster />.
 */

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { refreshVenueManager } from '@/lib/api/profiles';
import { useAuthStore } from '@/store/authStore';

/**
 * Root layout component.
 *
 * Notes:
 * - On mount, if the user is logged in, we try to refresh the `venueManager`
 *   flag from `/profiles/:name`. This is best-effort and failures are ignored.
 * - The main area renders the current route via `<Outlet />`.
 * - Includes a11y “Skip to content” link targeting `#main`.
 */
export default function App() {
  useEffect(() => {
    // Best-effort sync of the venueManager flag after reload / login restore.
    const { user, accessToken } = useAuthStore.getState();
    if (user?.name && accessToken) {
      refreshVenueManager(user.name).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-bg text-text font-sans antialiased">
      {/* Accessible skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4
                     focus:bg-brand focus:text-white focus:px-3 focus:py-2 rounded"
      >
        Skip to content
      </a>

      {/* Global header / nav */}
      <Header />

      {/* Routed content container */}
      <main id="main" className="container py-6 overflow-x-clip">
        <Outlet />
      </main>

      {/* Global footer */}
      <Footer />

      {/* Toast notifications (top center), short default duration */}
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    </div>
  );
}
