import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

/** Minimal, distraction-free shell for sign-in, registration and reset. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-sand-200/70 sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-sand-500">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
