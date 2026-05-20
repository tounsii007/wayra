import type { Route } from '@wayra/types';
import { sampleSuggestions } from './sample-suggestions';
import { distanceMeters } from '@wayra/shared';

const now = new Date();
const inMin = (m: number) => new Date(now.getTime() + m * 60_000).toISOString();

const fra = sampleSuggestions.find((p) => p.id === 'de:frankfurt:hbf')!;
const ber = sampleSuggestions.find((p) => p.id === 'de:berlin:hbf')!;
const paris = sampleSuggestions.find((p) => p.id === 'fr:paris:gare-de-lyon')!;

const CAR_SOLO_G_PER_KM = 170;
const ICE_G_PER_KM = 14;
const IC_G_PER_KM = 32;
const HSR_G_PER_KM = 6;

function co2(km: number, perKm: number): { co2Grams: number; co2SavedGrams: number } {
  const co2Grams = Math.round(km * perKm);
  const co2SavedGrams = Math.max(0, Math.round(km * CAR_SOLO_G_PER_KM) - co2Grams);
  return { co2Grams, co2SavedGrams };
}

const fraToBerKm = distanceMeters(fra.coordinates, ber.coordinates) / 1000;
const fraToParisKm = distanceMeters(fra.coordinates, paris.coordinates) / 1000;

export const mockRouteResults: Route[] = [
  {
    id: 'r-fast',
    departureTime: inMin(12),
    arrivalTime: inMin(252),
    durationSeconds: 240 * 60,
    transfers: 0,
    walkingMeters: 320,
    ...co2(fraToBerKm, ICE_G_PER_KM),
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
          line: {
            id: 'ice-1071',
            agencyId: 'db',
            shortName: 'ICE 1071',
            mode: 'rail',
            color: '#EC0016',
          },
          trip: { id: 't1', lineId: 'ice-1071', headsign: 'Berlin Hbf' },
        },
        from: fra,
        to: ber,
        departureTime: inMin(15),
        arrivalTime: inMin(250),
        distanceMeters: Math.round(fraToBerKm * 1000),
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
    ...co2(fraToBerKm * 1.08, IC_G_PER_KM),
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
        distanceMeters: Math.round(fraToBerKm * 1080),
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
    ...co2(fraToParisKm, HSR_G_PER_KM),
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
          line: {
            id: 'ice-12',
            agencyId: 'db',
            shortName: 'ICE 12',
            mode: 'rail',
            color: '#EC0016',
          },
          trip: { id: 't3', lineId: 'ice-12', headsign: 'Berlin Hbf' },
        },
        from: fra,
        to: paris,
        departureTime: inMin(62),
        arrivalTime: inMin(290),
        distanceMeters: Math.round(fraToParisKm * 1000),
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
