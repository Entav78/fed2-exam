import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';

const LeafletMapChunk = lazy(() => import('./LeafletMapChunk'));

type Props = {
  lat: number;
  lng: number;
  name?: string;
  height?: number; // px
  zoom?: number;
  className?: string;
};

// Load once when near viewport
function useInViewOnce(rootMargin = '800px') {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current || shown) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0 },
    );

    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  return { ref, shown };
}

export default function VenueMap(props: Props) {
  const height = props.height ?? 300;
  const { ref, shown } = useInViewOnce('800px');

  const skeleton = (
    <div
      className={`w-full overflow-hidden rounded-lg border border-border bg-[rgb(var(--fg))/0.06] animate-pulse ${props.className ?? ''}`}
      style={{ height }}
      aria-hidden
    />
  );

  return (
    <div ref={ref}>
      {shown ? (
        <Suspense fallback={skeleton}>
          <LeafletMapChunk {...props} height={height} />
        </Suspense>
      ) : (
        skeleton
      )}
    </div>
  );
}
