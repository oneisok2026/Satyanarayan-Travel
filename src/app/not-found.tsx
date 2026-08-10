import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-[75vh] place-items-center px-5 py-20">
      <div className="flex max-w-lg flex-col items-center gap-4 text-center">
        <p className="font-display text-7xl font-semibold text-brand-200 sm:text-8xl">
          404
        </p>

        <h1 className="text-2xl font-semibold text-sand-900 sm:text-3xl">
          This route doesn&apos;t exist
        </h1>

        <p className="text-[0.9375rem] leading-relaxed text-sand-600">
          The page you&apos;re looking for may have moved or never existed. Let&apos;s get
          you back on the map.
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/tours" variant="outline">
            Browse tour packages
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
