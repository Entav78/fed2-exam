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

      <div className="grid gap-8">
        {/* My bookings first so it's top on mobile and left on desktop */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">My bookings</h2>
          <MyBookingsList />
        </section>

        {isManager && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold mb-2">My venues</h2>
            <MyVenuesList />
          </section>
        )}
      </div>
    </section>
  );
}
