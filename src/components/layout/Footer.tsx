import Link from 'next/link';
import { clientEnv } from '@/lib/env';
import { FOOTER_NAV, CONTACT } from '@/constants/navigation';
import { Logo } from './Logo';
import { SocialIcons, type SocialLinkItem } from './SocialIcons';

/** Server Component — static content, no client JS shipped. */
export function Footer({
  socialLinks = [],
}: {
  socialLinks?: SocialLinkItem[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-sand-300">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            {/* items-start keeps the stacked lockup flush with the column. */}
            <Logo invert className="items-start" />

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand-400">
              We plan journeys across India and abroad — handpicked stays, sensible
              routing and a team that answers the phone when you are travelling.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-sm">
              {CONTACT.phones.map((phone, index) => (
                <a
                  key={phone.number}
                  href={phone.href}
                  className="inline-flex w-fit items-center gap-2 text-sand-300 transition-colors hover:text-white"
                >
                  {/* Icon on the first line only; the rest align beneath it. */}
                  {index === 0 ? <PhoneIcon /> : <span className="w-4" aria-hidden="true" />}
                  {phone.number}
                </a>
              ))}
              <a
                href={CONTACT.emailHref}
                className="inline-flex w-fit items-center gap-2 text-sand-300 transition-colors hover:text-white"
              >
                <MailIcon />
                {CONTACT.email}
              </a>
            </div>
          </div>

          <FooterColumn title="Explore" links={FOOTER_NAV.explore} />
          <FooterColumn title="Services" links={FOOTER_NAV.services} />

          <div>
            <FooterColumn title="Company" links={FOOTER_NAV.company} />

            {socialLinks.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 font-display text-sm font-semibold tracking-wide text-white uppercase">
                  Follow us
                </h2>
                <SocialIcons links={socialLinks} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-sand-500">
            © {year} {clientEnv.NEXT_PUBLIC_SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="font-display text-sm font-semibold tracking-wide text-white uppercase">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-sand-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
