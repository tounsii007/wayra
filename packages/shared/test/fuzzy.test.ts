import { fuzzyScore, normalize, levenshtein } from '../src/fuzzy';

describe('fuzzy.normalize', () => {
  it('lowercases and strips diacritics, preserving unicode punctuation', () => {
    // Em-dash (U+2014) is not a combining diacritic — it is preserved.
    expect(normalize('Café — Châtelet')).toBe('cafe — chatelet');
  });
  it('strips diacritics on regular letters', () => {
    expect(normalize('München Hauptbahnhof')).toBe('munchen hauptbahnhof');
  });
  it('handles ß → ss', () => {
    expect(normalize('Straße')).toBe('strasse');
  });
});

describe('fuzzy.levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('paris', 'paris')).toBe(0);
  });
  it('returns the edit distance', () => {
    expect(levenshtein('paris', 'pari')).toBe(1);
    expect(levenshtein('paris', 'paros')).toBe(1);
    expect(levenshtein('paris', 'london')).toBeGreaterThan(2);
  });
});

describe('fuzzy.fuzzyScore', () => {
  it('matches exact', () => {
    expect(fuzzyScore('Berlin', 'Berlin')).toBe(1);
  });
  it('rewards prefix matches strongly', () => {
    const score = fuzzyScore('frank', 'Frankfurt');
    expect(score).toBeGreaterThan(0.7);
  });
  it('tolerates typos', () => {
    expect(fuzzyScore('frnakfurt', 'Frankfurt')).toBeGreaterThan(0.2);
  });
  it('returns 0 for empty query', () => {
    expect(fuzzyScore('', 'Berlin')).toBe(0);
  });
});
