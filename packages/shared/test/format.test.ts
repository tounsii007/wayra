import { formatDuration, formatTime, formatDelayMinutes, formatCO2, formatFare } from '../src/format';

describe('formatDuration', () => {
  it('renders minutes only when under an hour', () => {
    expect(formatDuration(45 * 60, 'en')).toBe('45 m');
  });
  it('renders hours + minutes', () => {
    expect(formatDuration(75 * 60, 'en')).toBe('1 h 15 m');
  });
  it('renders hours alone when minutes = 0', () => {
    expect(formatDuration(2 * 3600, 'de')).toBe('2 h');
  });
});

describe('formatDelayMinutes', () => {
  it('returns empty for zero delay', () => {
    expect(formatDelayMinutes(0)).toBe('');
  });
  it('prefixes positive with +', () => {
    expect(formatDelayMinutes(180)).toBe('+3');
  });
  it('keeps sign for negative', () => {
    expect(formatDelayMinutes(-120)).toBe('-2');
  });
});

describe('formatCO2', () => {
  it('shows grams below 1kg', () => {
    expect(formatCO2(420, 'en')).toBe('420 g');
  });
  it('shows kg above 1kg', () => {
    expect(formatCO2(1234, 'en')).toMatch(/1\.2 kg/);
  });
});

describe('formatTime / formatFare', () => {
  it('formats an ISO timestamp', () => {
    expect(formatTime('2025-05-17T08:30:00Z', 'de')).toMatch(/\d{2}:\d{2}/);
  });
  it('formats a fare', () => {
    expect(formatFare(19.9, 'EUR', 'en')).toMatch(/19\.90/);
  });
});
