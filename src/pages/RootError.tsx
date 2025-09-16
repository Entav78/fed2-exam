/** @file RootError – top-level route error boundary for react-router. */

import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

/**
 * Narrow an unknown value to an object that has a string `message` field.
 *
 * Acts as a type guard so downstream code can safely read `.message`.
 *
 * @param x - Any unknown value to inspect.
 * @returns `true` if `x` is an object with a string `message` property.
 */
function isErrorWithMessage(x: unknown): x is { message: string } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'message' in x &&
    typeof (x as { message: unknown }).message === 'string'
  );
}

/**
 * Extract a human-friendly message from any error-like input.
 *
 * Prefers:
 * 1) a string value directly,
 * 2) `Error` instances (`err.message`),
 * 3) plain objects with a `message` string,
 * otherwise returns a safe fallback.
 *
 * @param err - Unknown error value.
 * @returns Best-guess error message for display.
 */
function getMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (isErrorWithMessage(err)) return err.message;
  return 'An unexpected error occurred.';
}

/**
 * RootError
 *
 * Error boundary UI used as the router-level `errorElement`.
 * - Handles router-thrown errors (`isRouteErrorResponse`) with status + text.
 * - Handles generic thrown errors (components, loaders) with a best-effort message.
 * - In dev, shows additional debug information (response data or stack).
 *
 * @example
 * const router = createBrowserRouter([
 *   { path: '/', element: <App />, errorElement: <RootError /> }
 * ]);
 *
 * @returns Error fallback UI.
 */
export default function RootError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <section className="mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2" role="alert">
          <span className="font-semibold">{error.status}</span> {error.statusText}
        </p>

        {import.meta.env.DEV && error.data ? (
          <pre className="mt-3 overflow-auto rounded bg-surface p-3 text-muted">
            {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
          </pre>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded bg-brand px-4 py-2 text-white">
            ← Back to home
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded border border-border px-4 py-2"
          >
            Reload
          </button>
        </div>
      </section>
    );
  }

  const message = getMessage(error);

  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Unexpected error</h1>
      <p className="mt-2 text-danger" role="alert">
        {message}
      </p>

      {import.meta.env.DEV && (error as Error)?.stack && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Stack trace (dev only)</summary>
          <pre className="mt-2 overflow-auto rounded bg-card p-3 text-xs text-muted">
            {(error as Error).stack}
          </pre>
        </details>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded bg-brand px-4 py-2 text-white">
          ← Back to home
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded border border-border px-4 py-2"
        >
          Reload
        </button>
      </div>
    </section>
  );
}
