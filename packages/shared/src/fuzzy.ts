/**
 * Lightweight fuzzy / typo-tolerant matching helpers for autocomplete.
 * For the MVP this lives client + server side; production should rely on
 * Postgres trigram or a dedicated search index (Meilisearch/Typesense).
 */

const DIACRITICS = /[̀-ͯ]/g;

/**
 * Normalize a string: lowercase, strip diacritics, collapse whitespace.
 * Handles common transliteration concerns for DE/FR/AR data.
 */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[ß]/g, 'ss')
    .replace(/[œ]/g, 'oe')
    .replace(/[æ]/g, 'ae')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Levenshtein distance — small inputs only (place names).
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,        // insert
        (prev[j] ?? 0) + 1,            // delete
        (prev[j - 1] ?? 0) + cost,     // substitute
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j] ?? 0;
  }
  return prev[n] ?? 0;
}

/**
 * Score a candidate against a query — higher is better, range 0-1.
 * Uses prefix match (cheap & high signal) + Levenshtein for fuzz tolerance.
 */
export function fuzzyScore(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (q.length === 0) return 0;
  if (c === q) return 1;
  if (c.startsWith(q)) return 0.95 - 0.1 * (1 - q.length / c.length);
  if (c.includes(q)) return 0.75;

  const dist = levenshtein(q, c.slice(0, q.length + 2));
  const maxLen = Math.max(q.length, 1);
  const sim = 1 - dist / maxLen;
  return Math.max(0, sim * 0.6);
}
