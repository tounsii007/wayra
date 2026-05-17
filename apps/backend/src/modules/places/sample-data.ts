import type { Place } from '@wayra/types';

// Backend sample dataset — kept in sync with the web sample for the MVP.
// Real production data is loaded from GTFS + OSM via importer scripts.
export const sampleSuggestions: Place[] = [
  {
    id: 'de:frankfurt:hbf',
    type: 'station',
    name: 'Frankfurt (Main) Hbf',
    coordinates: { lat: 50.1073, lng: 8.6638 },
    countryCode: 'DE',
    modes: ['rail', 'subway', 'tram', 'bus'],
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
    id: 'fr:paris:gare-du-nord',
    type: 'station',
    name: 'Paris Gare du Nord',
    coordinates: { lat: 48.8809, lng: 2.3553 },
    countryCode: 'FR',
    modes: ['rail', 'subway', 'bus'],
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
    id: 'tn:tunis:barcelone',
    type: 'station',
    name: 'Tunis — Place Barcelone',
    coordinates: { lat: 36.7937, lng: 10.1729 },
    countryCode: 'TN',
    modes: ['rail', 'tram', 'bus'],
    localizedNames: { ar: 'محطة برشلونة - تونس', fr: 'Gare de Tunis Barcelone' },
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
];
