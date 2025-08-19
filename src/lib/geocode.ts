// Geocode an address string -> { lat, lng } using Nominatim (OSM).
// Very lightweight and cached in localStorage to avoid rate limits.
export async function geocodeAddress(q: string) {
  const key = `geocode:${q}`;
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached) as { lat: number; lng: number };

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    q,
  )}`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' }, // optional: bias english names
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  localStorage.setItem(key, JSON.stringify(coords));
  return coords;
}
