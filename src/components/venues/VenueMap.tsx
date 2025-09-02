import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import * as L from 'leaflet';

// Simple inline SVG pin (brown to match your header/brand vibe)
const pinSvg = encodeURIComponent(`
<svg width="28" height="42" viewBox="0 0 28 42" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.27 21.73 0 14 0z" fill="#53423C"/>
  <circle cx="14" cy="14" r="5" fill="#fff"/>
</svg>
`);

const pinIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${pinSvg}`,
  iconSize: [28, 42],
  iconAnchor: [14, 42], // bottom-center of the icon
  popupAnchor: [0, -36],
});

type Props = {
  lat: number;
  lng: number;
  name?: string;
  height?: number; // px
  zoom?: number;
};

function ResizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 0); // first paint
    const onResize = () => map.invalidateSize(); // window resizes
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

export default function VenueMap({ lat, lng, name = 'Venue', height = 300, zoom = 13 }: Props) {
  const position: [number, number] = [lat, lng];

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-border-light"
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position} icon={pinIcon}>
          <Popup>{name}</Popup>
        </Marker>
        <ResizeOnMount />
      </MapContainer>
    </div>
  );
}
