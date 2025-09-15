import { lazy, Suspense } from 'react';

import { useInViewOnce } from '@/utils/useInViewOnce';

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
