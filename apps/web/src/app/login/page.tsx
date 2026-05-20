import { SiteHeader } from '@/components/site-header';
import { AuthForm } from './auth-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted mt-1 text-sm">
            Sign in or create an account to save favorites, routes and offline regions.
          </p>
        </header>
        <AuthForm />
      </main>
    </>
  );
}
