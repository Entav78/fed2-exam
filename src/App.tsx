import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function App() {
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
    </div>
  );
}
