import type { PlaceSuggestion, Place } from './place';
import type { Coordinates } from './geo';
import type { Route, RouteQuery } from './route';
import type { Departure, Disruption } from './realtime';
import type { FareComparison } from './fare';
import type { AiAssistantRequest, AiAssistantResponse } from './ai';

/* ---------- Search & Places ---------- */
export interface SearchRequest {
  query: string;
  near?: Coordinates;
  countryCodes?: string[];
  limit?: number;
  locale?: string;
}

export interface SearchResponse {
  suggestions: PlaceSuggestion[];
}

export interface NearbyStopsRequest {
  lat: number;
  lng: number;
  radiusMeters?: number;
  limit?: number;
}

export interface NearbyStopsResponse {
  stops: Array<Place & { distanceMeters: number }>;
}

/* ---------- Routes ---------- */
export interface PlanRouteResponse {
  routes: Route[];
  /** When no full route possible — graceful fallback */
  partial?: boolean;
  notice?: string;
}

export type PlanRouteRequest = RouteQuery;

/* ---------- Realtime ---------- */
export interface DeparturesRequest {
  stopId: string;
  limit?: number;
  /** Look-ahead window in minutes */
  windowMinutes?: number;
}

export interface DeparturesResponse {
  stop: Place;
  departures: Departure[];
  cachedAt?: string;
  liveDataAvailable: boolean;
}

export interface DisruptionsResponse {
  disruptions: Disruption[];
}

/* ---------- Fares ---------- */
export type FareEstimateRequest = RouteQuery;

export interface FareEstimateResponse {
  comparison: FareComparison;
}

/* ---------- AI ---------- */
export type AiRequest = AiAssistantRequest;
export type AiResponse = AiAssistantResponse;
