import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { getMessages, localeMetadata } from '@wayra/i18n';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@wayra/shared';
import type { Locale } from '@wayra/types';

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: getMessages(locale) as Record<string, string>,
    now: new Date(),
    timeZone: 'Europe/Berlin',
  };
});

async function resolveLocale(): Promise<Locale> {
  // 1. explicit cookie
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie)) return fromCookie;

  // 2. accept-language header
  const acceptLanguage = (await headers()).get('accept-language') ?? '';
  for (const part of acceptLanguage.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase().split('-')[0];
    if (tag && SUPPORTED_LOCALES.includes(tag as Locale)) return tag as Locale;
  }

  return DEFAULT_LOCALE;
}

export { localeMetadata };
