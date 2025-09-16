// src/pages/NotFoundPage.tsx

/** @file NotFoundPage – 404 route that shows the missing path and provides navigation options. */

import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * Renders a simple 404 page.
 * - Displays the current pathname.
 * - Offers a “Back” action (falls back to Home if no history).
 * - Provides a direct link to the Home page.
 */
export default function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleBack() {
    // If there’s no previous entry in the history stack, send them home.
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }

  return (
    <section className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-3xl font-bold">404 — Page not found</h1>
      <p className="mt-2 text-muted">
        We couldn’t find <code className="bg-surface px-1 py-0.5 rounded">{pathname}</code>.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-white"
          aria-label="Go to homepage"
        >
          ← Back to home
        </Link>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded border border-border px-4 py-2"
        >
          ⟵ Go back
        </button>
      </div>
    </section>
  );
}
