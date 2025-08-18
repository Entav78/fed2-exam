type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(0, currentPage - 3) + 5
  );

  return (
    <nav className="mt-6 flex items-center justify-center gap-2">
      <button
        className="px-3 py-1 rounded border border-border-light hover:bg-surface"
        onClick={() => go(currentPage - 1)}
        aria-label="Previous page"
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={`px-3 py-1 rounded border ${
            p === currentPage
              ? 'bg-brand text-white border-brand'
              : 'border-border-light hover:bg-surface'
          }`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button
        className="px-3 py-1 rounded border border-border-light hover:bg-surface"
        onClick={() => go(currentPage + 1)}
        aria-label="Next page"
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </nav>
  );
}
