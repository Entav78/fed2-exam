import MyBookingsList from '@/components/profile/MyBookingsList';
import MyVenuesList from '@/components/profile/MyVenuesList';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role());
  const isManager = role === 'manager';

  if (!user) return null;

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="text-muted">
          <span className="font-semibold">{user.name}</span> • {user.email} • {role}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-2">My bookings</h2>
          <MyBookingsList />
        </div>

        {isManager && (
          <div>
            <h2 className="text-lg font-semibold mb-2">My venues</h2>
            <MyVenuesList />
          </div>
        )}
      </div>
    </section>
  );
}
