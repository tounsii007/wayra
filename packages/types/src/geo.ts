export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat] GeoJSON order
}

export interface GeoLineString {
  type: 'LineString';
  coordinates: Array<[number, number]>;
}

export type GeoGeometry = GeoPoint | GeoLineString;

export interface Address {
  formatted: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  countryCode?: string;
}
