import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { messages } from '@wayra/i18n';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@wayra/shared';
import type { Locale } from '@wayra/types';
import { usePrefsStore } from './lib/prefs-store';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
const deviceResolved: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(deviceLocale)
  ? (deviceLocale as Locale)
  : DEFAULT_LOCALE;

i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    Object.entries(messages).map(([loc, msg]) => [loc, { translation: msg }]),
  ),
  lng: usePrefsStore.getState().localeOverride ?? deviceResolved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Pivot the language whenever the user changes it from Settings.
usePrefsStore.subscribe((state, prev) => {
  if (state.localeOverride !== prev.localeOverride) {
    const next = state.localeOverride ?? deviceResolved;
    if (i18n.language !== next) i18n.changeLanguage(next);
  }
});

export function deviceLanguage(): Locale {
  return deviceResolved;
}

export default i18n;
