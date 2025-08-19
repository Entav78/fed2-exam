import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export default function RootError() {
  const error = useRouteError();

  // Router-thrown errors (e.g., loaders/actions)
  if (isRouteErrorResponse(error)) {
    return (
      <section className="mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2">
          <span className="font-semibold">{error.status}</span> {error.statusText}
        </p>
        {error.data ? (
          <pre className="mt-3 overflow-auto rounded bg-surface p-3 text-sm opacity-80">
            {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
          </pre>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded bg-brand px-4 py-2 text-white">
            ← Back to home
          </Link>
          <button
            onClick={() => location.reload()}
            className="rounded border border-border-light px-4 py-2"
          >
            Reload
          </button>
        </div>
      </section>
    );
  }

  // Unknown errors (component throws, etc.)
  const message = (error as Error)?.message ?? 'An unexpected error occurred.';

  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Unexpected error</h1>
      <p className="mt-2 text-danger">{message}</p>

      {import.meta.env.DEV && (error as Error)?.stack && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Stack trace (dev only)</summary>
          <pre className="mt-2 overflow-auto rounded bg-surface p-3 text-xs opacity-80">
            {(error as Error).stack}
          </pre>
        </details>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded bg-brand px-4 py-2 text-white">
          ← Back to home
        </Link>
        <button
          onClick={() => location.reload()}
          className="rounded border border-border-light px-4 py-2"
        >
          Reload
        </button>
      </div>
    </section>
  );
}
