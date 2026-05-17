export type ISODateString = string;
export type ISODurationString = string;
export type UUID = string;

export type Locale = 'de' | 'en' | 'fr' | 'ar' | 'it' | 'es';

export type CountryCode = 'DE' | 'FR' | 'TN' | 'AT' | 'CH' | 'BE' | 'NL' | 'IT' | 'ES' | 'MA' | 'DZ';

export type Theme = 'light' | 'dark' | 'system';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: {
    requestId?: string;
    cached?: boolean;
    cachedAt?: ISODateString;
  };
}
