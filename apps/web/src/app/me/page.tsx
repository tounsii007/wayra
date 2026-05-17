import { SiteHeader } from '@/components/site-header';
import { ProfileClient } from './profile-client';

export const metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <ProfileClient />
      </main>
    </>
  );
}
