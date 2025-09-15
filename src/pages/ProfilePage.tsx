import { lazy, Suspense } from 'react';

import ProfileMediaEditor from '@/components/profile/ProfileMediaEditor';
import { useAuthStore } from '@/store/authStore';
import { useInViewOnce } from '@/utils/useInViewOnce';

const MyBookingsList = lazy(() => import('@/components/profile/MyBookingsList'));
const MyVenuesList = lazy(() => import('@/components/profile/MyVenuesList'));

function LazySection({ children }: { children: React.ReactNode }) {
  const { ref, shown } = useInViewOnce('600px');
  return (
    <div ref={ref}>
      <Suspense fallback={<div className="h-40 rounded border border-border bg-muted" />}>
        {shown ? children : null}
      </Suspense>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.isManager());
  if (!user) return null;

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Your profile</h1>
      </header>

      {/* Banner + avatar (banner becomes LCP) */}
      <ProfileMediaEditor />

      {/* My bookings */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">My bookings</h2>
        <LazySection>
          {/* make sure inside this list you pass priority={i===0} to the first card */}
          <MyBookingsList />
        </LazySection>
      </div>

      {/* Managers: venues */}
      {isManager && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">My venues</h2>
          <LazySection>
            {/* same: first card priority */}
            <MyVenuesList />
          </LazySection>
        </div>
      )}
    </section>
  );
}
