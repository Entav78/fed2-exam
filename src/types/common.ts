/** @file common.ts – shared domain types used across the app and API helpers. */

/**
 * Lightweight image/media descriptor.
 * - `url` should be an absolute http(s) URL.
 * - `alt` is recommended for accessibility and SEO; if absent, the UI may
 *   fall back to a sensible default (e.g., venue/profile name).
 *
 * @example
 * const avatar: Media = { url: "https://cdn.example.com/a.jpg", alt: "Jane Doe" };
 */
export type Media = {
  /** Absolute http(s) URL to the image/asset. */
  url: string;
  /** Alternative text for screen readers and fallbacks. */
  alt?: string;
};

/**
 * Minimal profile info often embedded on related resources (e.g., venue owner).
 * Fields may be omitted if not available from the endpoint being called.
 */
export type ProfileLite = {
  /** Display name / username. */
  name: string;
  /** Account email address. */
  email: string;
  /** Short user bio/description (optional). */
  bio?: string;
  /** Avatar image (optional; omitted when not set). */
  avatar?: Media;
  /** Profile banner/cover image (optional; omitted when not set). */
  banner?: Media;
};

/**
 * Structured location data for a venue.
 * All fields are optional; many APIs return only partial location info.
 * Coordinates, when present, should be valid WGS84:
 * - `lat` in the range [-90, 90]
 * - `lng` in the range [-180, 180]
 */
export type VenueLocation = {
  /** Street address (free text). */
  address?: string;
  /** City or locality. */
  city?: string;
  /** Postal/ZIP code. */
  zip?: string;
  /** Country name (canonicalized when possible, e.g., "Norway"). */
  country?: string;
  /** Continent name (optional, informational only). */
  continent?: string;
  /** Latitude in degrees (-90…90). */
  lat?: number;
  /** Longitude in degrees (-180…180). */
  lng?: number;
};

/**
 * Amenity flags for a venue. Missing fields should be treated as `false`.
 */
export type VenueMeta = {
  /** Wi-Fi available. */
  wifi?: boolean;
  /** Parking available. */
  parking?: boolean;
  /** Breakfast offered. */
  breakfast?: boolean;
  /** Pets allowed. */
  pets?: boolean;
};
