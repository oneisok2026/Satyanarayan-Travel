import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppWidget } from '@/components/layout/WhatsAppWidget';
import { BackToTop } from '@/components/layout/BackToTop';
import { listSocialLinks } from '@/services/content.service';
import { logger } from '@/lib/logger';

/** Shared chrome for every public page. */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The header appears on every page, so a database hiccup must not take the
  // whole site down over a row of icons.
  let socialLinks: Awaited<ReturnType<typeof listSocialLinks>> = [];
  try {
    socialLinks = await listSocialLinks();
  } catch (error) {
    logger.warn('social links lookup failed; header renders without them', { error });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header socialLinks={socialLinks} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer socialLinks={socialLinks} />
      <BackToTop />
      <WhatsAppWidget />
    </div>
  );
}
