import type { ApiResponse } from '@wayra/types';

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Default request timeout in ms */
  timeoutMs?: number;
  /** Default headers, e.g. Authorization */
  headers?: Record<string, string>;
  /** Hook to refresh auth on 401 */
  onUnauthorized?: () => Promise<void>;
}

/**
 * Minimal typed JSON API client used by web + mobile.
 * Handles timeout, JSON parsing, error normalization, and the
 * `{ data, error }` envelope returned by the Wayra backend.
 */
export class ApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const url = new URL(path.replace(/^\//, ''), this.opts.baseUrl.replace(/\/?$/, '/'));
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.opts.timeoutMs ?? 15_000);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { ...this.opts.headers, ...init.headers },
        signal: ctrl.signal,
      });

      if (res.status === 401 && this.opts.onUnauthorized) {
        await this.opts.onUnauthorized();
      }

      let payload: ApiResponse<T> | null = null;
      try {
        payload = (await res.json()) as ApiResponse<T>;
      } catch {
        // non-JSON response
      }

      if (!res.ok || payload?.error) {
        const err = payload?.error;
        throw new ApiClientError(
          err?.code ?? `http_${res.status}`,
          err?.message ?? res.statusText,
          res.status,
          err?.details,
        );
      }

      if (!payload || payload.data === undefined) {
        throw new ApiClientError('invalid_response', 'API response had no data field', res.status);
      }
      return payload.data;
    } catch (e) {
      if (e instanceof ApiClientError) throw e;
      if ((e as { name?: string })?.name === 'AbortError') {
        throw new ApiClientError('timeout', 'Request timed out');
      }
      throw new ApiClientError('network', (e as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }
}
