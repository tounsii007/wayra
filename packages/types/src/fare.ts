import type { CountryCode } from './common';

export type TicketType =
  | 'single'
  | 'return'
  | 'day_pass'
  | 'multi_day'
  | 'week'
  | 'month'
  | 'year'
  | 'group'
  | 'family'
  | 'student'
  | 'senior'
  | 'saver' // Sparpreis / Prem's
  | 'flex';

export interface FareOffer {
  id: string;
  agencyId: string;
  countryCode: CountryCode;
  type: TicketType;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  /** Source of price */
  source: 'official' | 'estimated' | 'unknown';
  /** When official, link to buy */
  bookingUrl?: string;
  /** Validity window */
  validFrom?: string;
  validUntil?: string;
  /** Coverage area description */
  coverage?: string;
}

export interface FareComparison {
  cheapest?: FareOffer;
  fastestPaid?: FareOffer;
  offers: FareOffer[];
  /** When official prices not available */
  hasEstimatesOnly: boolean;
}
