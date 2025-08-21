import { Link } from 'react-router-dom';

export default function ManageVenuesPage() {
  return (
    <section className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Manage venues</h1>
      <p className="text-muted mb-4">Coming soon: list and edit your venues.</p>
      <Link to="/venues/new" className="underline text-brand">
        Create a new venue →
      </Link>
    </section>
  );
}
