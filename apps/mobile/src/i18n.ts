import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { messages } from '@wayra/i18n';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@wayra/shared';
import type { Locale } from '@wayra/types';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
const resolved: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(deviceLocale)
  ? (deviceLocale as Locale)
  : DEFAULT_LOCALE;

i18n
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(messages).map(([loc, msg]) => [loc, { translation: msg }]),
    ),
    lng: resolved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
