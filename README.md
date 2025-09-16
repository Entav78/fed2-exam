# Holidaze — Venue Booking SPA (React + TypeScript + Vite)

A single‑page application where users can search venues, check availability, and make bookings. Venue managers can create, edit, and delete their venues.

**Live:** https://fed2-exam.netlify.app/

---

## Features

- 🔎 **Venue discovery** with full‑text search, filters (price, amenities, country/city), URL‑synced query
- 📅 **Availability calendar** that blocks past & booked dates and prevents overlapping selections
- 🗺️ **Map** on venue detail (stored coordinates with geocoded fallback)
- 🔐 **Auth** (login/register) + **protected routes** and role guard (manager)
- 👤 **Profile**: bookings list, your venues list (for managers), avatar & banner editor
- 🏢 **Venue management**: create/edit/delete with multi‑image support & validation
- ⚡ **Performance**: lazy‑loaded routes, responsive images, static‑map fallback, small UI bundles

## Tech Stack

- **React 18**, **TypeScript**
- **Vite** with **@vitejs/plugin-react**
- **React Router**
- **Zustand** (auth & theme stores)
- **Tailwind CSS**
- **react-day-picker**, **date-fns**
- **react-hot-toast**

---

## Getting Started

```bash
# 1) Install deps
npm install

# 2) Configure env (see below), then run dev
npm run dev
```

### Environment Variables

Create a `.env` (or copy `.env.example`) and set:

```ini
VITE_API_BASE_URL=https://v2.api.noroff.dev
# Optional (if provided it’s sent as X-Noroff-API-Key)
VITE_API_KEY=your-noroff-api-key
```

The app talks to the Noroff API for auth, profiles, venues, and bookings.

### Data Sources & APIs

- **Noroff API** — primary backend for authentication, profiles, venues, bookings.
- **Map/Geocoding (non‑Noroff)** — used only to render a **static map image** on the venue page
  when a venue has no photos and/or when coordinates are missing. The app uses
  an OpenStreetMap-based service (Nominatim for geocoding + a static map image service).
  No API keys are required, but responses are rate‑limited by those services. Please
  respect their usage policies and attribution requirements (© OpenStreetMap contributors).

### Scripts

- `dev` — start Vite dev server
- `build` — type‑check and build for production
- `preview` — preview the production build locally
- `lint` — run ESLint

---

## Project Structure (high level)

```bash
src/
  components/
    layout/      # Header, Footer, shared UI
    profile/     # Profile widgets (bookings, venues, media editor)
    venues/      # VenueCard, VenueGallery, BookingCalendar, VenueMap, etc.
    ui/          # Buttons and small UI primitives
  hooks/         # Custom hooks (e.g., useGeocodedStaticMap)
  lib/
    api/         # API calls: venues, bookings, profiles
    geocode/     # Geocoding helper
  pages/         # Route pages (Home, VenueDetail, Login, Register, Profile, Manage)
  routes/        # Route guards (RequireAuth, RequireManager)
  store/         # Zustand stores (auth, theme)
  styles/        # Tailwind & theme CSS
  utils/         # Helpers (images, dates, locations, etc.)
```

---

## Performance & Accessibility Notes

- **Images**
  - Responsive `srcSet` + `sizes` for the gallery hero (Unsplash/Pexels supported)
  - Intrinsic `width/height` + `aspect-ratio` to reduce CLS
  - Static‑map fallback when a venue has no photos
- **Routing**
  - All main pages are lazy‑loaded with `React.Suspense`
- **Map**
  - Fallback geocoding used when coordinates are missing
- **A11y**
  - Skip link, labeled form controls, semantic headings, visible focus styles

---

## Known Limitations

- Client‑side SPA only (no SSR)
- Geocoding precision depends on venue address quality

---

## License

MIT © Hilde-Kathrine Ljosland Vatne
