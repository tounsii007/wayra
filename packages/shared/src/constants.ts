import type { CountryCode, Locale } from '@wayra/types';

export const SUPPORTED_LOCALES: readonly Locale[] = ['de', 'en', 'fr', 'ar', 'it', 'es'] as const;

export const RTL_LOCALES: readonly Locale[] = ['ar'] as const;

export const DEFAULT_LOCALE: Locale = 'en';

export const MVP_COUNTRIES: readonly CountryCode[] = ['DE', 'FR', 'TN'] as const;

export const COUNTRY_NAMES: Record<CountryCode, Partial<Record<Locale, string>>> = {
  DE: { de: 'Deutschland', en: 'Germany', fr: 'Allemagne', ar: 'ألمانيا' },
  FR: { de: 'Frankreich', en: 'France', fr: 'France', ar: 'فرنسا' },
  TN: { de: 'Tunesien', en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
  AT: { de: 'Österreich', en: 'Austria', fr: 'Autriche' },
  CH: { de: 'Schweiz', en: 'Switzerland', fr: 'Suisse' },
  BE: { de: 'Belgien', en: 'Belgium', fr: 'Belgique' },
  NL: { de: 'Niederlande', en: 'Netherlands', fr: 'Pays-Bas' },
  IT: { de: 'Italien', en: 'Italy', fr: 'Italie' },
  ES: { de: 'Spanien', en: 'Spain', fr: 'Espagne' },
  MA: { de: 'Marokko', en: 'Morocco', fr: 'Maroc', ar: 'المغرب' },
  DZ: { de: 'Algerien', en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' },
};

export const COUNTRY_DEFAULT_CENTER: Record<
  CountryCode,
  { lat: number; lng: number; zoom: number }
> = {
  DE: { lat: 51.165, lng: 10.452, zoom: 6 },
  FR: { lat: 46.603, lng: 1.888, zoom: 6 },
  TN: { lat: 33.886, lng: 9.537, zoom: 7 },
  AT: { lat: 47.516, lng: 14.55, zoom: 7 },
  CH: { lat: 46.818, lng: 8.227, zoom: 8 },
  BE: { lat: 50.503, lng: 4.469, zoom: 8 },
  NL: { lat: 52.132, lng: 5.291, zoom: 8 },
  IT: { lat: 41.872, lng: 12.567, zoom: 6 },
  ES: { lat: 40.464, lng: -3.749, zoom: 6 },
  MA: { lat: 31.792, lng: -7.092, zoom: 6 },
  DZ: { lat: 28.034, lng: 1.659, zoom: 5 },
};

/** Generic CO2 grams per passenger-km — used for rough comparisons. */
export const CO2_PER_KM = {
  car_solo: 170,
  car_shared: 85,
  bus: 68,
  coach: 27,
  rail_regional: 32,
  rail_long_distance: 14,
  rail_high_speed: 6,
  subway: 4,
  tram: 4,
  walk: 0,
  bike: 0,
} as const;
