import { SiteHeader } from '@/components/site-header';
import { SettingsClient } from './settings-client';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <SettingsClient />
      </main>
    </>
  );
}
