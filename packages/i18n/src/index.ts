import type { Locale } from '@wayra/types';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import it from './locales/it.json';
import es from './locales/es.json';

export const messages: Record<Locale, Record<string, unknown>> = {
  de,
  en,
  fr,
  ar,
  it,
  es,
};

export type MessageKey = keyof typeof en;

export function getMessages(locale: Locale): Record<string, unknown> {
  return messages[locale] ?? messages.en;
}

export const localeMetadata: Record<Locale, { label: string; nativeLabel: string; rtl: boolean }> = {
  de: { label: 'German', nativeLabel: 'Deutsch', rtl: false },
  en: { label: 'English', nativeLabel: 'English', rtl: false },
  fr: { label: 'French', nativeLabel: 'Français', rtl: false },
  ar: { label: 'Arabic', nativeLabel: 'العربية', rtl: true },
  it: { label: 'Italian', nativeLabel: 'Italiano', rtl: false },
  es: { label: 'Spanish', nativeLabel: 'Español', rtl: false },
};
