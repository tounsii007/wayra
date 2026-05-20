import type {
  Place,
  PlaceSuggestion,
  Route,
  PlanRouteRequest,
  PlanRouteResponse,
  Departure,
  Disruption,
  FareComparison,
} from '@wayra/types';
import { useAuthStore } from './auth-store';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Envelope<T> {
  data?: T;
  error?: { code: string; message: string };
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init.headers ?? {}) as Record<string, string>),
  };
  if (init.auth) {
    const token = useAuthStore.getState().token;
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const payload = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || payload.error) {
    throw new ApiError(
      payload.error?.code ?? `http_${res.status}`,
      payload.error?.message ?? res.statusText,
      res.status,
    );
  }
  if (payload.data === undefined) throw new ApiError('invalid_response', 'Empty data', res.status);
  return payload.data;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    locale: string;
    theme: string;
    role?: string;
    emailVerified?: boolean;
  };
}

export const api = {
  baseUrl: BASE,

  // --- places ---
  search(query: string, opts: { limit?: number; lat?: number; lng?: number } = {}) {
    const q = new URLSearchParams({
      q: query,
      ...(opts.limit ? { limit: String(opts.limit) } : {}),
    });
    if (opts.lat !== undefined) q.set('lat', String(opts.lat));
    if (opts.lng !== undefined) q.set('lng', String(opts.lng));
    return request<{ suggestions: PlaceSuggestion[] }>(`/api/search?${q}`);
  },
  nearby(lat: number, lng: number, radiusMeters = 600, limit = 10) {
    return request<{ stops: Array<Place & { distanceMeters: number }> }>(
      `/api/stops/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}&limit=${limit}`,
    );
  },
  place(id: string) {
    return request<Place>(`/api/stations/${encodeURIComponent(id)}`);
  },

  // --- routes ---
  plan(body: PlanRouteRequest) {
    return request<PlanRouteResponse>('/api/routes/plan', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  route(id: string) {
    return request<Route>(`/api/routes/${encodeURIComponent(id)}`);
  },

  // --- realtime ---
  departures(stopId: string, limit = 12) {
    return request<{
      stop: { id: string; name?: string };
      departures: Departure[];
      liveDataAvailable: boolean;
    }>(`/api/realtime/departures?stopId=${encodeURIComponent(stopId)}&limit=${limit}`);
  },
  disruptions(country?: string) {
    const q = country ? `?country=${encodeURIComponent(country)}` : '';
    return request<{ disruptions: Disruption[] }>(`/api/realtime/disruptions${q}`);
  },
  networkStatus(country?: string) {
    const q = country ? `?country=${encodeURIComponent(country)}` : '';
    return request<{
      items: Array<{
        city: string;
        country: string;
        status: 'ok' | 'minor' | 'major';
        note: string;
        locale: string;
      }>;
      generatedAt: string;
    }>(`/api/realtime/network-status${q}`);
  },

  // --- fares ---
  fareEstimate(body: PlanRouteRequest) {
    return request<{ comparison: FareComparison }>('/api/fares/estimate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // --- AI ---
  assistant(body: {
    message: string;
    locale: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    return request<{ reply: string; suggestions?: string[] }>('/api/ai/travel-assistant', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // --- auth ---
  signup(body: { email: string; password: string; displayName?: string; locale?: string }) {
    return request<AuthSessionResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  login(body: { email: string; password: string }) {
    return request<AuthSessionResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  refresh(refreshToken: string) {
    return request<AuthSessionResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  logout(refreshToken: string) {
    return request<{ ok: true }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  forgotPassword(email: string) {
    return request<{ ok: true }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  me() {
    return request<{
      id: string;
      email: string | null;
      displayName: string | null;
      locale: string;
      theme: string;
      role?: string;
      emailVerified?: boolean;
    }>('/api/auth/me', { auth: true });
  },
  updateProfile(body: {
    displayName?: string;
    locale?: string;
    theme?: string;
    homeCountry?: string;
  }) {
    return request<{
      id: string;
      email: string | null;
      displayName: string | null;
      locale: string;
      theme: string;
    }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(body), auth: true });
  },
  changePassword(body: { currentPassword: string; newPassword: string }) {
    return request<{ ok: true }>('/api/auth/me/password', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    });
  },
  deleteAccount(body: { password: string }) {
    return request<{ ok: true }>('/api/auth/me', {
      method: 'DELETE',
      body: JSON.stringify(body),
      auth: true,
    });
  },

  // --- account ---
  favorites() {
    return request<
      Array<{
        id: string;
        kind: 'home' | 'work' | 'custom';
        label: string | null;
        placeId: string | null;
      }>
    >('/api/me/favorites', { auth: true });
  },
  addFavorite(body: { kind: 'home' | 'work' | 'custom'; placeId: string; label?: string }) {
    return request<{ id: string }>('/api/me/favorites', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    });
  },
  removeFavorite(id: string) {
    return request<{ ok: true }>(`/api/me/favorites/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
    });
  },
  savedRoutes() {
    return request<
      Array<{
        id: string;
        label: string | null;
        data: Record<string, unknown>;
        notifyOnDisruption: boolean;
      }>
    >('/api/me/routes', { auth: true });
  },
  saveRoute(body: { label?: string; data: Record<string, unknown>; notify?: boolean }) {
    return request<{ id: string }>('/api/me/routes', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    });
  },

  // --- notifications ---
  addExpoSubscription(body: { token: string; platform: 'ios' | 'android' }) {
    return request<{ id: string }>('/api/me/notifications/subscriptions/expo', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    });
  },
  addWebPushSubscription(body: { endpoint: string; p256dh?: string; auth?: string }) {
    return request<{ id: string }>('/api/me/notifications/subscriptions/web', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    });
  },
  removePushSubscription(endpoint: string) {
    return request<{ ok: true }>('/api/me/notifications/subscriptions', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
      auth: true,
    });
  },
  getNotificationPrefs() {
    return request<{
      pushEnabled: boolean;
      emailEnabled: boolean;
      channels: Record<string, boolean>;
    }>('/api/me/notifications/preferences', { auth: true });
  },
  setNotificationPrefs(body: {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    channels?: Record<string, boolean>;
  }) {
    return request<{
      pushEnabled: boolean;
      emailEnabled: boolean;
      channels: Record<string, boolean>;
    }>('/api/me/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(body),
      auth: true,
    });
  },

  // --- offline ---
  offlineRegions() {
    return request<{
      regions: Array<{
        id: string;
        name: string;
        countryCode: string;
        sizeBytes: number;
        version: string;
        bbox: [number, number, number, number];
      }>;
    }>('/api/offline/regions');
  },
};
