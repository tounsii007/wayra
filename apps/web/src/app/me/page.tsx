import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProfileClient } from './profile-client';

export const metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <ProfileClient />
      </main>
      <SiteFooter />
    </>
  );
}
