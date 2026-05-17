import { Injectable } from '@nestjs/common';
import { distanceMeters } from '@wayra/shared';
import type { FareComparison, FareOffer, RouteQuery } from '@wayra/types';
import { PlacesService } from '../places/places.service';

/**
 * Fare service.
 *
 * MVP: estimates per country based on rough distance between origin and
 * destination. Production integrates DB Spar/Flex, SNCF tariffs, SNCFT,
 * IDFM, and various German Verbund tariffs, plus Deutschlandticket /
 * Pass Rail Jeune detection.
 */
@Injectable()
export class FaresService {
  constructor(private readonly places: PlacesService) {}

  async estimate(req: RouteQuery): Promise<{ comparison: FareComparison }> {
    const from = 'placeId' in req.from ? await this.places.findById(req.from.placeId) : null;
    const to = 'placeId' in req.to ? await this.places.findById(req.to.placeId) : null;
    const country = (from?.countryCode ?? to?.countryCode ?? 'DE').toUpperCase();

    const km = from && to ? distanceMeters(from.coordinates, to.coordinates) / 1000 : 50;
    const adults = Math.max(1, req.adults ?? 1);
    const children = Math.max(0, req.children ?? 0);
    const passengers = adults + children * 0.5;

    const offers = this.offersForCountry(country, km, passengers);

    const cheapest = offers.reduce<FareOffer | undefined>(
      (best, o) => (!best || o.amount < best.amount ? o : best),
      undefined,
    );
    const fastestPaid = offers.find((o) => o.type === 'flex' || o.type === 'single');

    return {
      comparison: {
        cheapest,
        fastestPaid,
        offers,
        hasEstimatesOnly: offers.some((o) => o.source !== 'official'),
      },
    };
  }

  offers(params: { country?: string; type?: string }): { offers: FareOffer[] } {
    const all: FareOffer[] = [
      {
        id: 'de:deutschlandticket',
        agencyId: 'verbund',
        countryCode: 'DE',
        type: 'month',
        name: 'Deutschlandticket',
        amount: 58.0,
        currency: 'EUR',
        source: 'official',
        description: 'Bundesweit gültig im Nahverkehr.',
      },
      {
        id: 'fr:tgvmax',
        agencyId: 'sncf',
        countryCode: 'FR',
        type: 'month',
        name: 'Max Jeune',
        amount: 79.0,
        currency: 'EUR',
        source: 'official',
      },
      {
        id: 'tn:sncft:single',
        agencyId: 'sncft',
        countryCode: 'TN',
        type: 'single',
        name: 'Billet Tunis–Sousse',
        amount: 11.5,
        currency: 'TND',
        source: 'estimated',
      },
    ];
    return {
      offers: all.filter(
        (o) =>
          (!params.country || o.countryCode === params.country.toUpperCase()) &&
          (!params.type || o.type === params.type),
      ),
    };
  }

  // --- helpers ---

  private offersForCountry(country: string, km: number, passengers: number): FareOffer[] {
    if (country === 'FR') {
      return [
        {
          id: 'fr:sncf:tgv',
          agencyId: 'sncf',
          countryCode: 'FR',
          type: 'single',
          name: 'TGV INOUI',
          amount: round((15 + 0.11 * km) * passengers),
          currency: 'EUR',
          source: 'estimated',
        },
        {
          id: 'fr:sncf:ter',
          agencyId: 'sncf',
          countryCode: 'FR',
          type: 'single',
          name: 'TER',
          amount: round((8 + 0.08 * km) * passengers),
          currency: 'EUR',
          source: 'estimated',
        },
        {
          id: 'fr:sncf:flex',
          agencyId: 'sncf',
          countryCode: 'FR',
          type: 'flex',
          name: 'Flex',
          amount: round((25 + 0.16 * km) * passengers),
          currency: 'EUR',
          source: 'estimated',
        },
      ];
    }
    if (country === 'TN') {
      return [
        {
          id: 'tn:sncft:single',
          agencyId: 'sncft',
          countryCode: 'TN',
          type: 'single',
          name: 'SNCFT 2ᵉ classe',
          amount: round((2 + 0.06 * km) * passengers),
          currency: 'TND',
          source: 'estimated',
        },
        {
          id: 'tn:sncft:first',
          agencyId: 'sncft',
          countryCode: 'TN',
          type: 'single',
          name: 'SNCFT 1ʳᵉ classe',
          amount: round((3 + 0.09 * km) * passengers),
          currency: 'TND',
          source: 'estimated',
        },
      ];
    }
    // Default: Germany
    return [
      {
        id: 'de:db:spar',
        agencyId: 'db',
        countryCode: 'DE',
        type: 'saver',
        name: 'Sparpreis',
        amount: round((10 + 0.05 * km) * passengers),
        currency: 'EUR',
        source: 'estimated',
        description: 'Sparpreis (Schätzung).',
      },
      {
        id: 'de:db:flex',
        agencyId: 'db',
        countryCode: 'DE',
        type: 'flex',
        name: 'Flexpreis',
        amount: round((30 + 0.15 * km) * passengers),
        currency: 'EUR',
        source: 'estimated',
      },
      {
        id: 'de:deutschlandticket',
        agencyId: 'verbund',
        countryCode: 'DE',
        type: 'month',
        name: 'Deutschlandticket',
        amount: 58.0,
        currency: 'EUR',
        source: 'official',
        description: 'Bundesweit im Nahverkehr.',
      },
    ];
  }
}

function round(x: number): number {
  return Math.max(1, Math.round(x * 10) / 10);
}
