import { ApiClient } from '@wayra/shared';

export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  timeoutMs: 12_000,
});
