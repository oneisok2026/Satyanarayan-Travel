/**
 * Security headers applied to every response.
 * CSP is intentionally scoped to the services this app actually talks to:
 * Firebase Auth, Google identity, and MongoDB (server-side only, so not listed).
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/**
 * Build output directory.
 *
 * Defaults to `.next`. On Windows an editor can hold an open handle inside
 * that folder, and Next.js then hangs on startup — it prints "Starting..."
 * and never compiles, because it cannot clear the stale output. `npm run
 * clean` detects that and sets NEXT_DIST_DIR to a fresh directory so work
 * can continue without closing the editor or rebooting.
 */
const distDir = process.env.NEXT_DIST_DIR || '.next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [64, 96, 128, 200, 256, 320, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  experimental: {
    // Keeps the Mongoose/Firebase Admin native deps out of the client bundle.
    serverActions: { bodySizeLimit: '4mb' },
  },

  // Mongoose and firebase-admin must never be bundled for the browser.
  serverExternalPackages: ['mongoose', 'firebase-admin'],

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
