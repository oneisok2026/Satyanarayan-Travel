import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/env';

/**
 * Web app manifest.
 *
 * Chrome on Android reads its icon from here in preference to <link rel=icon>
 * for history entries, tab strips and the home-screen shortcut. Without a
 * manifest it falls back to the host's own icon, which is why the deployed
 * site was showing the platform "V" rather than the company mark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: clientEnv.NEXT_PUBLIC_SITE_NAME,
    short_name: 'Satyanarayan',
    description:
      'Handcrafted holiday packages, honeymoon getaways and group tours across India and abroad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfcfa',
    theme_color: '#12312f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
