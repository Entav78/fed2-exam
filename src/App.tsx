// src/App.tsx
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function App() {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-background text-text">
      {/* Accessible skip link (shows when focused) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4
                   focus:bg-brand focus:text-white focus:px-3 focus:py-2 rounded"
      >
        Skip to content
      </a>

      <Header />

      <main id="main" className="container py-6">
        <h1 className="text-3xl font-bold">Holidaze</h1>
        <p className="mt-2 text-text-muted">
          Starter layout is live. Tokens loaded. Ready to wire pages.
        </p>

        {/* Temp color check (keep or remove) */}
        <div className="mt-6 space-y-1">
          <h2 className="text-brand font-semibold">Brand color</h2>
          <p className="text-success">Success</p>
          <p className="text-danger">Danger</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
