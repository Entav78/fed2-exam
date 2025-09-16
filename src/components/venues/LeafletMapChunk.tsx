/** @file LeafletMapChunk – small Leaflet map with a custom pin and resize fix on mount. */

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

type Props = {
  /** Latitude for the marker and initial center. */
  lat: number;
  /** Longitude for the marker and initial center. */
  lng: number;
  /** Popup/label text for the marker (defaults to "Venue"). */
  name?: string;
  /** Fixed height in pixels for the map container (defaults to 300). */
  height?: number;
  /** Initial zoom level (defaults to 13). */
  zoom?: number;
  /** Extra class names for the outer wrapper. */
  className?: string;
};

/** Inline SVG pin (brand-colored), encoded as a data URL. */
const pinSvg = encodeURIComponent(`
<svg width="28" height="42" viewBox="0 0 28 42" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.27 21.73 0 14 0z" fill="#53423C"/>
  <circle cx="14" cy="14" r="5" fill="#fff"/>
</svg>
`);
const pinIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${pinSvg}`,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -36],
});

/**
 * On first render and on window resize, force Leaflet to recalc dimensions.
 * @remarks Useful when the map is inside a flex/grid or a newly shown tab/panel.
 */
function ResizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 0);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

/**
 * LeafletMapChunk
 *
 * Minimal Leaflet map with an OSM tile layer and a single marker.
 * Uses a fixed-height wrapper and disables wheel zoom for calmer UX.
 */
export default function LeafletMapChunk({
  lat,
  lng,
  name = 'Venue',
  height = 300,
  zoom = 13,
  className = '',
}: Props) {
  const position: [number, number] = [lat, lng];

  return (
    <div
      role="region"
      aria-label={`Map location: ${name}`}
      className={`w-full overflow-hidden rounded-lg border border-border ${className}`}
      style={{ height }}
    >
      <MapContainer
        key={`${lat},${lng}`}
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={position} icon={pinIcon}>
          <Popup>{name}</Popup>
        </Marker>
        <ResizeOnMount />
      </MapContainer>
    </div>
  );
}
