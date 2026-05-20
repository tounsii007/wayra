import type { Coordinates, BoundingBox } from '@wayra/types';

const EARTH_RADIUS_M = 6_371_000;

/**
 * Haversine distance between two coordinates, in meters.
 */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Format a distance in meters into a localized short string.
 * e.g. 850 → "850 m", 1240 → "1.2 km"
 */
export function formatDistance(meters: number, locale = 'de'): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${nf.format(meters / 1000)} km`;
}

/**
 * Approximate bounding box for a center point + radius (meters).
 * Uses a simple flat-earth approximation — fine for radii under ~50 km.
 */
export function boundingBoxFor(center: Coordinates, radiusMeters: number): BoundingBox {
  const deltaLat = (radiusMeters / EARTH_RADIUS_M) * (180 / Math.PI);
  const deltaLng = deltaLat / Math.cos((center.lat * Math.PI) / 180);
  return {
    north: center.lat + deltaLat,
    south: center.lat - deltaLat,
    east: center.lng + deltaLng,
    west: center.lng - deltaLng,
  };
}
