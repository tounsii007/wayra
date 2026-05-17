import type { Route } from '@wayra/types';
import { sampleSuggestions } from './sample-suggestions';

const now = new Date();
const inMin = (m: number) => new Date(now.getTime() + m * 60_000).toISOString();

const fra = sampleSuggestions.find((p) => p.id === 'de:frankfurt:hbf')!;
const ber = sampleSuggestions.find((p) => p.id === 'de:berlin:hbf')!;
const paris = sampleSuggestions.find((p) => p.id === 'fr:paris:gare-de-lyon')!;

export const mockRouteResults: Route[] = [
  {
    id: 'r-fast',
    departureTime: inMin(12),
    arrivalTime: inMin(252),
    durationSeconds: 240 * 60,
    transfers: 0,
    walkingMeters: 320,
    co2Grams: 8400,
    co2SavedGrams: 42_000,
    tags: ['fastest', 'recommended', 'eco'],
    fare: { amount: 59.9, currency: 'EUR', source: 'estimated' },
    legs: [
      {
        mode: { kind: 'walk' },
        from: fra,
        to: fra,
        departureTime: inMin(12),
        arrivalTime: inMin(15),
        distanceMeters: 220,
      },
      {
        mode: {
          kind: 'transit',
          mode: 'rail',
          line: { id: 'ice-1071', agencyId: 'db', shortName: 'ICE 1071', mode: 'rail', color: '#EC0016' },
          trip: { id: 't1', lineId: 'ice-1071', headsign: 'Berlin Hbf' },
        },
        from: fra,
        to: ber,
        departureTime: inMin(15),
        arrivalTime: inMin(250),
        distanceMeters: 552_000,
        delaySeconds: 0,
      },
      {
        mode: { kind: 'walk' },
        from: ber,
        to: ber,
        departureTime: inMin(250),
        arrivalTime: inMin(252),
        distanceMeters: 100,
      },
    ],
  },
  {
    id: 'r-cheap',
    departureTime: inMin(38),
    arrivalTime: inMin(380),
    durationSeconds: 342 * 60,
    transfers: 1,
    walkingMeters: 540,
    co2Grams: 12_300,
    co2SavedGrams: 38_000,
    tags: ['cheapest'],
    fare: { amount: 27.9, currency: 'EUR', source: 'estimated', note: 'Sparpreis' },
    legs: [
      {
        mode: { kind: 'walk' },
        from: fra,
        to: fra,
        departureTime: inMin(38),
        arrivalTime: inMin(42),
        distanceMeters: 280,
      },
      {
        mode: {
          kind: 'transit',
          mode: 'rail',
          line: { id: 'ic-2', agencyId: 'db', shortName: 'IC 2', mode: 'rail', color: '#0a4ea2' },
          trip: { id: 't2', lineId: 'ic-2', headsign: 'Leipzig Hbf' },
        },
        from: fra,
        to: ber,
        departureTime: inMin(42),
        arrivalTime: inMin(376),
        distanceMeters: 600_000,
        delaySeconds: 180,
      },
      {
        mode: { kind: 'walk' },
        from: ber,
        to: ber,
        departureTime: inMin(376),
        arrivalTime: inMin(380),
        distanceMeters: 260,
      },
    ],
  },
  {
    id: 'r-direct',
    departureTime: inMin(60),
    arrivalTime: inMin(295),
    durationSeconds: 235 * 60,
    transfers: 0,
    walkingMeters: 200,
    co2Grams: 7900,
    co2SavedGrams: 43_000,
    tags: ['fewest_transfers'],
    fare: { amount: 89.9, currency: 'EUR', source: 'estimated', note: 'Flex' },
    legs: [
      {
        mode: { kind: 'walk' },
        from: fra,
        to: fra,
        departureTime: inMin(60),
        arrivalTime: inMin(62),
        distanceMeters: 100,
      },
      {
        mode: {
          kind: 'transit',
          mode: 'rail',
          line: { id: 'ice-12', agencyId: 'db', shortName: 'ICE 12', mode: 'rail', color: '#EC0016' },
          trip: { id: 't3', lineId: 'ice-12', headsign: 'Berlin Hbf' },
        },
        from: fra,
        to: paris,
        departureTime: inMin(62),
        arrivalTime: inMin(290),
        distanceMeters: 1_200_000,
      },
      {
        mode: { kind: 'walk' },
        from: paris,
        to: paris,
        departureTime: inMin(290),
        arrivalTime: inMin(295),
        distanceMeters: 100,
      },
    ],
  },
];
