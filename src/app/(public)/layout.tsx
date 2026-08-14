import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppWidget } from '@/components/layout/WhatsAppWidget';
import { BackToTop } from '@/components/layout/BackToTop';
import { listSocialLinks } from '@/services/content.service';
import { forPlacement, getSiteContact } from '@/services/contact.service';
import { logger } from '@/lib/logger';

/** Shared chrome for every public page. */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The header appears on every page, so a database hiccup must not take the
  // whole site down over a row of icons. getSiteContact handles its own
  // failure and returns the environment fallback.
  let socialLinks: Awaited<ReturnType<typeof listSocialLinks>> = [];
  try {
    socialLinks = await listSocialLinks();
  } catch (error) {
    logger.warn('social links lookup failed; header renders without them', { error });
  }

  const contact = await getSiteContact();

  // The top bar has room for one address beside the numbers, so only the
  // primary email goes there; the footer lists every published line.
  const headerEmail = contact.primaryEmail;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        socialLinks={socialLinks}
        phones={forPlacement(contact.phones, 'header')}
        emails={
          headerEmail && headerEmail.placement !== 'footer' ? [headerEmail] : []
        }
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer
        socialLinks={socialLinks}
        phones={forPlacement(contact.phones, 'footer')}
        emails={forPlacement(contact.emails, 'footer')}
      />
      <BackToTop />
      <WhatsAppWidget number={contact.primaryWhatsapp?.value} />
    </div>
  );
}
