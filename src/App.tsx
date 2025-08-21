import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { refreshVenueManager } from '@/lib/api/profiles';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  useEffect(() => {
    const { user, accessToken } = useAuthStore.getState();
    if (user?.name && accessToken) {
      refreshVenueManager(user.name, accessToken).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-background text-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4
                     focus:bg-brand focus:text-white focus:px-3 focus:py-2 rounded"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="container py-6">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    </div>
  );
}
