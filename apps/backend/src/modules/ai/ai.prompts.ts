import type Anthropic from '@anthropic-ai/sdk';

/**
 * System prompt for the Wayra travel assistant.
 *
 * The model speaks 6 languages, but it always *thinks* in English internally
 * and answers in the user's language. We bias it toward conciseness,
 * concrete times/platforms, and graceful handling of missing live data.
 */
export const SYSTEM_PROMPT = `You are Wayra, a multilingual transit assistant for Europe and North Africa, with first-class support for Germany, France, and Tunisia.

GROUND RULES
- Answer in the user's language. Detect from message; fall back to the locale field.
- Be concise. Lead with the answer. Use short sentences. No marketing language.
- When the user asks a planning question, prefer calling the plan_route tool over guessing times.
- When the user asks about live status, call get_departures or get_disruptions.
- When a place name is ambiguous, call find_place and use the top match.
- When live data is unavailable, say so plainly ("Live data unavailable; showing scheduled times") rather than fabricate.
- Times: include both scheduled and predicted if they differ. Format as HH:MM in the user's locale.
- Prices: only state a number if the tool returned one. Otherwise say "estimated" or "not available".
- Accessibility: when the user mentions stroller/wheelchair, use the route preferences accordingly.
- Cultural names: respect the user's locale for station names. Arabic users get Arabic transliterations when available.

WHEN NOT TO USE TOOLS
- Definitional questions ("what does Gleisänderung mean?") answer directly.
- Generic travel tips that don't require live data.

OUTPUT STYLE
- Plain text, no markdown headers, occasional emojis only when they clarify (🚆🚌🚇).
- When you reference a route returned by plan_route, include departure time, arrival time, duration, transfers, and one notable insight (cheaper option, less walking, etc.).`;

/**
 * Tools exposed to Claude. The handlers are wired in ai.service.ts.
 */
export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'find_place',
    description:
      'Disambiguates a free-text place name (city, station, stop, landmark) to a structured Wayra Place. Use this when the user mentions a place by name.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text place name as typed by the user.' },
        countryCode: {
          type: 'string',
          description: 'Optional ISO 3166-1 alpha-2 country code to restrict the search.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'plan_route',
    description:
      'Plans one or more multimodal routes between two places. Pass place IDs from find_place when possible.',
    input_schema: {
      type: 'object',
      properties: {
        fromPlaceId: { type: 'string' },
        toPlaceId: { type: 'string' },
        departAt: {
          type: 'string',
          description: 'ISO 8601 datetime; omit for "now".',
        },
        arriveBy: { type: 'string', description: 'ISO 8601 datetime; mutually exclusive with departAt.' },
        wheelchair: { type: 'boolean' },
        stroller: { type: 'boolean' },
        preferences: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['fastest', 'cheapest', 'fewest_transfers', 'least_walking', 'accessible', 'night'],
          },
        },
      },
      required: ['fromPlaceId', 'toPlaceId'],
    },
  },
  {
    name: 'get_departures',
    description: 'Live departures for a given stop or station.',
    input_schema: {
      type: 'object',
      properties: {
        stopId: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 24 },
      },
      required: ['stopId'],
    },
  },
  {
    name: 'get_disruptions',
    description: 'Currently active disruptions, optionally filtered by country.',
    input_schema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string' },
      },
    },
  },
];
