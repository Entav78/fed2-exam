import { Link } from 'react-router-dom';

export default function NewVenueTile() {
  return (
    <Link
      to="/manage"
      className="flex items-center justify-center rounded border-2 border-dashed border-border-light bg-card p-4 text-sm hover:bg-muted"
      aria-label="Create a new venue"
    >
      <span className="text-lg mr-2">＋</span>
      Create new venue
    </Link>
  );
}
