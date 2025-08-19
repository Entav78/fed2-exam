export function isFiniteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

type LatLng = { lat: number; lng: number };

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

/**
 * Valid if inside Web Mercator bounds and NOT within ~600km of (0,0).
 * (Catches garbage coords like 0,0 or 0.3, -0.8 etc.)
 */
export function isLikelyValidCoords(lat?: number, lng?: number) {
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) return false;
  if (lat < -85.05113 || lat > 85.05113) return false;
  if (lng < -180 || lng > 180) return false;
  const nearNullIsland = haversineKm({ lat, lng }, { lat: 0, lng: 0 }) < 600;
  return !nearNullIsland;
}
