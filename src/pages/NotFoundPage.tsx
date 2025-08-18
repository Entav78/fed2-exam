import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <section className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-3xl font-bold">404 — Page not found</h1>
      <p className="mt-2 text-muted">
        We couldn’t find{' '}
        <code className="bg-surface px-1 py-0.5 rounded">
          {location.pathname}
        </code>
        .
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-white"
        >
          ← Back to home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded border border-border-light px-4 py-2"
        >
          ⟵ Go back
        </button>
      </div>
    </section>
  );
}
