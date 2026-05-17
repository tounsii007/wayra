import type { ISODateString, Locale, Theme, CountryCode, UUID } from './common';
import type { Place } from './place';
import type { Route } from './route';

export interface User {
  id: UUID;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  locale: Locale;
  theme: Theme;
  homeCountry?: CountryCode;
  createdAt: ISODateString;
}

export type FavoriteKind = 'home' | 'work' | 'custom';

export interface FavoritePlace {
  id: UUID;
  userId: UUID;
  kind: FavoriteKind;
  label: string;
  place: Place;
  createdAt: ISODateString;
}

export interface SavedRoute {
  id: UUID;
  userId: UUID;
  label?: string;
  route: Route;
  /** Notify when disruption on this route */
  notifyOnDisruption: boolean;
  createdAt: ISODateString;
}

export interface OfflineRegion {
  id: UUID;
  userId?: UUID;          // optional for anonymous downloads
  name: string;
  countryCode: CountryCode;
  /** Bounding box or city ID */
  bbox?: [number, number, number, number];
  /** Size in bytes */
  sizeBytes: number;
  /** Data version — comparable timestamps */
  version: ISODateString;
  downloadedAt: ISODateString;
  /** Days since download */
  staleness?: number;
}

export interface NotificationPreference {
  userId: UUID;
  pushEnabled: boolean;
  emailEnabled: boolean;
  channels: {
    delay: boolean;
    cancellation: boolean;
    platformChange: boolean;
    departureSoon: boolean;
    tightTransfer: boolean;
    disruptionOnFavorite: boolean;
    priceChange: boolean;
    offlineDataStale: boolean;
  };
}
