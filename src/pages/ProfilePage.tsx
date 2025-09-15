import { lazy, Suspense, useEffect } from 'react';

import ProfileMediaEditor from '@/components/profile/ProfileMediaEditor';
import { useAuthStore } from '@/store/authStore';
//import { useInViewOnce } from '@/utils/useInViewOnce';

const MyBookingsList = lazy(() => import('@/components/profile/MyBookingsList'));
const MyVenuesList = lazy(() => import('@/components/profile/MyVenuesList'));

function BookingsSkeleton() {
  return (
    <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr">
      <li>
        <div className="card min-h-[112px] flex items-center gap-4">
          <div className="h-16 w-24 rounded border border-border bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-3 w-1/4 bg-muted rounded" />
          </div>
          <div className="ml-auto flex gap-2">
            <div className="h-8 w-24 bg-muted rounded border border-border" />
            <div className="h-8 w-16 bg-muted rounded border border-border" />
          </div>
        </div>
      </li>
    </ul>
  );
}

function VenuesSkeleton() {
  return (
    <ul className="grid gap-4 xl:grid-cols-2 auto-rows-fr list-none p-0 m-0">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="card min-h-[128px] flex items-center gap-4">
            <div className="h-32 w-32 rounded border border-border bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
              <div className="h-3 w-1/5 bg-muted rounded" />
            </div>
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-16 bg-muted rounded border border-border" />
              <div className="h-8 w-20 bg-muted rounded border border-border" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.isManager());
  const bannerUrl = useAuthStore((s) => s.user?.banner?.url);

  // ---- Preload the LCP banner on this route ----
  useEffect(() => {
    if (!bannerUrl) return;

    // 1) Preconnect to the banner's origin (only if we haven't already)
    let createdPreconnect = false;
    try {
      const origin = new URL(bannerUrl).origin;
      const existing = document.querySelector<HTMLLinkElement>(
        `link[rel="preconnect"][href="${origin}"]`,
      );
      if (!existing) {
        const pc = document.createElement('link');
        pc.rel = 'preconnect';
        pc.href = origin;
        pc.crossOrigin = 'anonymous';
        document.head.appendChild(pc);
        createdPreconnect = true;
      }
    } catch {
      // ignore bad URLs
    }

    // 2) Preload the banner image itself (matches your <img sizes>)
    const pl = document.createElement('link');
    pl.rel = 'preload';
    pl.as = 'image';
    pl.href = bannerUrl;
    pl.setAttribute('imagesizes', '(min-width:1024px) 1024px, 100vw');
    pl.crossOrigin = 'anonymous';
    document.head.appendChild(pl);

    return () => {
      // remove the preload tag we created
      if (pl.parentNode) pl.parentNode.removeChild(pl);
      // only remove preconnect if we created it here
      if (createdPreconnect) {
        const origin = (() => {
          try {
            return new URL(bannerUrl).origin;
          } catch {
            return null;
          }
        })();
        if (origin) {
          const link = document.querySelector<HTMLLinkElement>(
            `link[rel="preconnect"][href="${origin}"]`,
          );
          if (link?.parentNode) link.parentNode.removeChild(link);
        }
      }
    };
  }, [bannerUrl]);

  // ----------------------------------------------

  // Early return AFTER hooks to keep hook order stable
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
        <Suspense fallback={<BookingsSkeleton />}>
          <MyBookingsList />
        </Suspense>
      </div>

      {/* Managers: venues */}
      {isManager && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">My venues</h2>
          <Suspense fallback={<VenuesSkeleton />}>
            <MyVenuesList />
          </Suspense>
        </div>
      )}
    </section>
  );
}
