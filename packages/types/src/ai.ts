import type { Locale } from './common';
import type { Route } from './route';
import type { Disruption } from './realtime';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Optional structured tool/intent payloads attached to the message */
  attachments?: AiAttachment[];
}

export type AiAttachment =
  | { kind: 'route'; route: Route }
  | { kind: 'disruption'; disruption: Disruption }
  | { kind: 'place_suggestion'; placeId: string };

export interface AiAssistantRequest {
  message: string;
  locale: Locale;
  history?: AiChatMessage[];
  /** User context — current location, country, etc. */
  context?: {
    coordinates?: { lat: number; lng: number };
    countryCode?: string;
    nowISO?: string;
  };
}

export interface AiAssistantResponse {
  reply: string;
  attachments?: AiAttachment[];
  /** Suggested follow-up prompts */
  suggestions?: string[];
}
