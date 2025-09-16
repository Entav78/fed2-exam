/** @file VenueMap – lazy-loaded Leaflet map that mounts when scrolled near viewport. */

import { lazy, Suspense } from 'react';

import { useInViewOnce } from '@/utils/useInViewOnce';

import 'leaflet/dist/leaflet.css';

const LeafletMapChunk = lazy(() => import('./LeafletMapChunk'));

type Props = {
  /** Latitude for the marker/center. */
  lat: number;
  /** Longitude for the marker/center. */
  lng: number;
  /** Marker/popup label (optional). */
  name?: string;
  /** Fixed map height in pixels (default: 300). */
  height?: number;
  /** Initial zoom level (passed through). */
  zoom?: number;
  /** Extra classes for the outer skeleton wrapper. */
  className?: string;
};

/**
 * VenueMap
 *
 * Wrapper that:
 * - Defers loading Leaflet (via `React.lazy`) to cut initial JS.
 * - Uses an intersection observer (`useInViewOnce`) to only mount the map
 *   when near the viewport (default root margin: 800px).
 * - Shows a lightweight skeleton until the map is ready.
 *
 * @remarks The actual map implementation lives in {@link LeafletMapChunk}.
 */
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
