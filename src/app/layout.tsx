import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { clientEnv } from '@/lib/env';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getCurrentUser } from '@/lib/firebase/auth';
import { toSessionUser } from '@/services/user.service';
import './globals.css';

/**
 * Self-hosted via next/font: no render-blocking request to Google's CDN, and
 * `display: swap` means text paints immediately in the fallback face.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK'],
});

const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
const siteName = clientEnv.NEXT_PUBLIC_SITE_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Curated Domestic & International Tour Packages`,
    template: `%s | ${siteName}`,
  },
  description:
    'Handcrafted holiday packages, honeymoon getaways and group tours across India and abroad. Talk to a travel expert and travel with confidence.',
  applicationName: siteName,
  keywords: [
    'travel agency',
    'tour packages',
    'domestic tours',
    'international tours',
    'holiday packages',
    'honeymoon packages',
    'hotel booking',
    'car rental',
    'flight booking',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: { telephone: true, address: false, email: false },
  alternates: { canonical: '/' },
  /*
   * Square, pre-cropped icons rather than the 1536x1024 logo. Browsers and
   * Android's "add to home screen" squeeze a wide source into a square slot,
   * which is what reduced the mark to an unreadable sliver; these are
   * centre-cropped so the temple lockup survives at 16px.
   */
  icons: {
    icon: [
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon-32.png',
    apple: [{ url: '/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName,
    title: `${siteName} — Curated Domestic & International Tour Packages`,
    description:
      'Handcrafted holiday packages, honeymoon getaways and group tours across India and abroad.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} — Curated Tour Packages`,
    description:
      'Handcrafted holiday packages across India and abroad. Talk to a travel expert today.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfcfa' },
    { media: '(prefers-color-scheme: dark)', color: '#12312f' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved server-side from the session cookie so the first paint already
  // knows who is signed in — no auth flicker, and no reliance on localStorage.
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="en-IN" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider initialUser={user ? toSessionUser(user) : null}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
