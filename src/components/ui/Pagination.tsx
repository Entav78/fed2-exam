/** @file Pagination – simple numbered pager with prev/next controls. */

type Props = {
  /** 1-based index of the current page. */
  currentPage: number;
  /** Total number of pages (>= 1). */
  totalPages: number;
  /** Handler invoked when the page changes (receives a 1-based page). */
  onPageChange: (page: number) => void;
};

/**
 * Pagination
 *
 * Renders a window of up to 5 pages centered near the current page,
 * with Previous/Next controls. Pages are clamped to `[1, totalPages]`.
 */
export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(0, currentPage - 3) + 5,
  );

  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
        onClick={() => go(currentPage - 1)}
        aria-label="Previous page"
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => go(p)}
          className={`px-3 py-1 rounded border ${
            p === currentPage
              ? 'bg-brand text-white border-brand'
              : 'border-border hover:bg-surface'
          }`}
          aria-current={p === currentPage ? 'page' : undefined}
          aria-label={`Page ${p}`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
        onClick={() => go(currentPage + 1)}
        aria-label="Next page"
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </nav>
  );
}
