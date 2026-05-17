import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { ServiceWorkerRegister } from '@/components/sw-register';
import { RTL_LOCALES } from '@wayra/shared';
import type { Locale } from '@wayra/types';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Wayra — Travel. Simple. Connected.',
    template: '%s · Wayra',
  },
  description:
    'Plan, search and ride. Trains, buses and metros across Europe and North Africa — in one beautiful app.',
  applicationName: 'Wayra',
  authors: [{ name: 'Wayra' }],
  keywords: [
    'transit',
    'public transport',
    'train',
    'bus',
    'metro',
    'Deutschland',
    'France',
    'Tunisie',
    'GTFS',
    'travel planner',
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Wayra' },
  openGraph: {
    title: 'Wayra',
    description: 'Trains, buses and metros across Europe and North Africa — in one app.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
