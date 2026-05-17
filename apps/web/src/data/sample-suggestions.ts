import type { Place } from '@wayra/types';

/**
 * MVP sample dataset — covers the most-searched places in DE / FR / TN.
 * The real autocomplete is served by the backend (Postgres trigram + GTFS).
 * This static set powers offline-style demos and Storybook stories.
 */
export const sampleSuggestions: Place[] = [
  // Germany
  {
    id: 'de:frankfurt:hbf',
    type: 'station',
    name: 'Frankfurt (Main) Hbf',
    coordinates: { lat: 50.1073, lng: 8.6638 },
    countryCode: 'DE',
    modes: ['rail', 'subway', 'tram', 'bus'],
    address: { formatted: 'Frankfurt am Main, DE', city: 'Frankfurt am Main' },
    externalIds: { ibnr: '8000105' },
  },
  {
    id: 'de:frankfurt:airport',
    type: 'airport',
    name: 'Frankfurt Flughafen',
    coordinates: { lat: 50.0379, lng: 8.5622 },
    countryCode: 'DE',
    modes: ['rail', 'bus'],
    address: { formatted: 'Flughafen Frankfurt, DE', city: 'Frankfurt am Main' },
  },
  {
    id: 'de:frankfurt:konstablerwache',
    type: 'metro_station',
    name: 'Konstablerwache',
    coordinates: { lat: 50.115, lng: 8.685 },
    countryCode: 'DE',
    modes: ['subway', 'tram', 'bus'],
    address: { formatted: 'Frankfurt am Main, DE', city: 'Frankfurt am Main' },
  },
  {
    id: 'de:berlin:hbf',
    type: 'station',
    name: 'Berlin Hauptbahnhof',
    coordinates: { lat: 52.5251, lng: 13.3694 },
    countryCode: 'DE',
    modes: ['rail', 'subway', 'tram', 'bus'],
  },
  {
    id: 'de:berlin:alexanderplatz',
    type: 'metro_station',
    name: 'Alexanderplatz',
    coordinates: { lat: 52.5219, lng: 13.4132 },
    countryCode: 'DE',
    modes: ['subway', 'tram', 'bus'],
  },
  {
    id: 'de:munich:hbf',
    type: 'station',
    name: 'München Hbf',
    coordinates: { lat: 48.1402, lng: 11.5586 },
    countryCode: 'DE',
    modes: ['rail', 'subway', 'tram', 'bus'],
  },
  {
    id: 'de:hamburg:hbf',
    type: 'station',
    name: 'Hamburg Hauptbahnhof',
    coordinates: { lat: 53.5528, lng: 10.0067 },
    countryCode: 'DE',
    modes: ['rail', 'subway', 'bus'],
  },
  {
    id: 'de:cologne:hbf',
    type: 'station',
    name: 'Köln Hbf',
    coordinates: { lat: 50.9429, lng: 6.9588 },
    countryCode: 'DE',
    modes: ['rail', 'subway', 'tram', 'bus'],
  },

  // France
  {
    id: 'fr:paris:gare-du-nord',
    type: 'station',
    name: 'Paris Gare du Nord',
    coordinates: { lat: 48.8809, lng: 2.3553 },
    countryCode: 'FR',
    modes: ['rail', 'subway', 'bus'],
    localizedNames: { ar: 'باريس - محطة الشمال' },
  },
  {
    id: 'fr:paris:gare-de-lyon',
    type: 'station',
    name: 'Paris Gare de Lyon',
    coordinates: { lat: 48.8443, lng: 2.3743 },
    countryCode: 'FR',
    modes: ['rail', 'subway', 'bus'],
  },
  {
    id: 'fr:paris:chatelet',
    type: 'metro_station',
    name: 'Châtelet — Les Halles',
    coordinates: { lat: 48.8616, lng: 2.347 },
    countryCode: 'FR',
    modes: ['subway'],
  },
  {
    id: 'fr:lyon:part-dieu',
    type: 'station',
    name: 'Lyon Part-Dieu',
    coordinates: { lat: 45.7606, lng: 4.8597 },
    countryCode: 'FR',
    modes: ['rail', 'tram', 'bus'],
  },
  {
    id: 'fr:marseille:saint-charles',
    type: 'station',
    name: 'Marseille Saint-Charles',
    coordinates: { lat: 43.3025, lng: 5.3806 },
    countryCode: 'FR',
    modes: ['rail', 'subway', 'bus'],
  },

  // Tunisia
  {
    id: 'tn:tunis:marine',
    type: 'metro_station',
    name: 'Tunis Marine',
    coordinates: { lat: 36.7997, lng: 10.1842 },
    countryCode: 'TN',
    modes: ['tram', 'bus'],
    localizedNames: { ar: 'تونس مارين', fr: 'Tunis Marine' },
  },
  {
    id: 'tn:tunis:barcelone',
    type: 'station',
    name: 'Tunis — Place Barcelone',
    coordinates: { lat: 36.7937, lng: 10.1729 },
    countryCode: 'TN',
    modes: ['rail', 'tram', 'bus'],
    localizedNames: { ar: 'محطة برشلونة - تونس', fr: 'Gare de Tunis Barcelone' },
  },
  {
    id: 'tn:tunis:republique',
    type: 'metro_station',
    name: 'République',
    coordinates: { lat: 36.8004, lng: 10.179 },
    countryCode: 'TN',
    modes: ['tram'],
    localizedNames: { ar: 'الجمهورية', fr: 'République' },
  },
  {
    id: 'tn:tunis:airport',
    type: 'airport',
    name: 'Tunis-Carthage Airport',
    coordinates: { lat: 36.8525, lng: 10.2272 },
    countryCode: 'TN',
    modes: ['bus'],
    localizedNames: { ar: 'مطار تونس قرطاج', fr: 'Aéroport de Tunis-Carthage' },
  },
  {
    id: 'tn:sousse:central',
    type: 'station',
    name: 'Sousse',
    coordinates: { lat: 35.8245, lng: 10.6396 },
    countryCode: 'TN',
    modes: ['rail', 'bus'],
    localizedNames: { ar: 'سوسة' },
  },
  {
    id: 'tn:sfax:central',
    type: 'station',
    name: 'Sfax',
    coordinates: { lat: 34.7398, lng: 10.7603 },
    countryCode: 'TN',
    modes: ['rail', 'bus'],
    localizedNames: { ar: 'صفاقس' },
  },
];

export const popularRoutes: Array<{
  id: string;
  from: Place;
  to: Place;
  durationMin: number;
  modes: string[];
  countryCode: string;
}> = [
  {
    id: 'de:fra-ber',
    from: sampleSuggestions[0]!,
    to: sampleSuggestions[3]!,
    durationMin: 240,
    modes: ['rail'],
    countryCode: 'DE',
  },
  {
    id: 'fr:paris-lyon',
    from: sampleSuggestions[9]!,
    to: sampleSuggestions[12]!,
    durationMin: 117,
    modes: ['rail'],
    countryCode: 'FR',
  },
  {
    id: 'tn:tunis-sousse',
    from: sampleSuggestions[14]!,
    to: sampleSuggestions[18]!,
    durationMin: 135,
    modes: ['rail'],
    countryCode: 'TN',
  },
];
