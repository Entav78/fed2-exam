// src/pages/ProfilePage.tsx
import MyBookingsList from '@/components/profile/MyBookingsList';
import MyVenuesList from '@/components/profile/MyVenuesList';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.isManager());

  // Optional if route is protected by <RequireAuth />
  if (!user) return null;

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      {/* header / user info */}
      <header>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="text-sm text-muted">
          {user.name} • {user.email} • {isManager ? 'manager' : 'customer'}
        </p>
      </header>

      {/* My bookings */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">My bookings</h2>
        <MyBookingsList />
      </div>

      {/* My venues only for managers */}
      {isManager && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">My venues</h2>
          <MyVenuesList />
        </div>
      )}
    </section>
  );
}
