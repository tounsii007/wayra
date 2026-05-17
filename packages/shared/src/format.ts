import type { Locale } from '@wayra/types';

/**
 * Format a duration in seconds into a localized human-readable string.
 * e.g. 4500 → "1h 15min" (de) / "1h 15m" (en)
 */
export function formatDuration(seconds: number, locale: Locale = 'de'): string {
  const totalMin = Math.round(seconds / 60);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  const minLabel: Record<Locale, string> = {
    de: 'min',
    en: 'm',
    fr: 'min',
    ar: 'د',
    it: 'min',
    es: 'min',
  };
  const hLabel: Record<Locale, string> = {
    de: 'h',
    en: 'h',
    fr: 'h',
    ar: 'س',
    it: 'h',
    es: 'h',
  };

  if (hours === 0) return `${mins} ${minLabel[locale]}`;
  if (mins === 0) return `${hours} ${hLabel[locale]}`;
  return `${hours} ${hLabel[locale]} ${mins} ${minLabel[locale]}`;
}

/**
 * Format ISO datetime → "HH:mm" local time.
 */
export function formatTime(iso: string, locale: Locale = 'de'): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format a delay in seconds with a sign.
 * 0 → "" (caller decides), 120 → "+2", -60 → "-1"
 */
export function formatDelayMinutes(delaySeconds: number): string {
  if (delaySeconds === 0) return '';
  const min = Math.round(delaySeconds / 60);
  return min > 0 ? `+${min}` : `${min}`;
}

/**
 * Format a fare as currency.
 */
export function formatFare(amount: number, currency: string, locale: Locale = 'de'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format CO2 in grams to "120 g" or "1.2 kg".
 */
export function formatCO2(grams: number, locale: Locale = 'de'): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (grams < 1000) return `${Math.round(grams)} g`;
  return `${nf.format(grams / 1000)} kg`;
}
