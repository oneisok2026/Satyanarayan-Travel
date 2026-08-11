import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Environment variable safety (PART 28).
 *
 * These tests read the source tree rather than the runtime config, so they
 * fail on the mistake that actually leaks a secret: prefixing a server-only
 * variable with NEXT_PUBLIC_, or reading one inside a Client Component.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Never allowed to reach the browser under any circumstances. */
const SERVER_ONLY = [
  'MONGODB_URI',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'RESEND_API_KEY',
  'SMTP_PASSWORD',
  'SESSION_COOKIE_NAME',
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
  }
  return files;
}

const sourceFiles = walk(SRC);

const clientFiles = sourceFiles.filter((file) => {
  const head = readFileSync(file, 'utf8').slice(0, 200);
  return head.includes("'use client'") || head.includes('"use client"');
});

describe('server-only variables are never public', () => {
  it.each(SERVER_ONLY)('%s is not prefixed with NEXT_PUBLIC_', (name) => {
    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8');
      expect(
        source.includes(`NEXT_PUBLIC_${name}`),
        `${file} exposes ${name} via NEXT_PUBLIC_`,
      ).toBe(false);
    }
  });

  it('no Client Component reads a server-only variable', () => {
    const offenders: string[] = [];

    for (const file of clientFiles) {
      const source = readFileSync(file, 'utf8');
      for (const name of SERVER_ONLY) {
        // Matches process.env.NAME, but not NEXT_PUBLIC_-prefixed reads.
        if (new RegExp(`process\\.env\\.${name}\\b`).test(source)) {
          offenders.push(`${file} reads ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('no Client Component imports serverEnv()', () => {
    const offenders = clientFiles.filter((file) =>
      /\bserverEnv\s*\(/.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('no Client Component imports the Firebase Admin SDK', () => {
    const offenders = clientFiles.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return (
        source.includes('firebase-admin') ||
        source.includes('@/lib/firebase/admin') ||
        source.includes('@/lib/firebase/session') ||
        source.includes('@/lib/firebase/storage')
      );
    });
    expect(offenders).toEqual([]);
  });

  it('no Client Component imports a Mongoose model', () => {
    const offenders = clientFiles.filter((file) =>
      /from '@\/models\//.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

describe('server modules are marked server-only', () => {
  const mustBeServerOnly = [
    'src/lib/firebase/admin.ts',
    'src/lib/firebase/session.ts',
    'src/lib/firebase/auth.ts',
    'src/lib/firebase/storage.ts',
    'src/lib/db/connect.ts',
    'src/lib/security/upload.ts',
    'src/lib/email/provider.ts',
    'src/services/user.service.ts',
    'src/services/booking.service.ts',
    'src/services/enquiry.service.ts',
    'src/services/audit.service.ts',
    'src/services/page-seo.service.ts',
    'src/services/admin-notifications.service.ts',
  ];

  it.each(mustBeServerOnly)('%s imports server-only', (relative) => {
    const source = readFileSync(join(ROOT, relative), 'utf8');
    // The import is what turns a client-side leak into a build error.
    expect(source).toContain("import 'server-only'");
  });
});

describe('.env.example documents every required variable', () => {
  const example = readFileSync(join(ROOT, '.env.example'), 'utf8');

  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'MONGODB_URI',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'SESSION_COOKIE_NAME',
  ];

  it.each(required)('documents %s', (name) => {
    expect(example).toContain(name);
  });

  it('ships no real secret values', () => {
    // Every secret line must be blank or an obvious placeholder.
    const secretLines = example
      .split('\n')
      .filter((line) =>
        /^(MONGODB_URI|FIREBASE_PRIVATE_KEY|FIREBASE_CLIENT_EMAIL|RESEND_API_KEY|SMTP_PASSWORD)=/.test(
          line,
        ),
      );

    for (const line of secretLines) {
      const value = line.split('=').slice(1).join('=').replace(/"/g, '').trim();
      expect(value === '' || value.includes('example'), `${line} looks real`).toBe(true);
    }
  });
});

describe('.gitignore excludes real environment files', () => {
  const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');

  it.each(['.env', '.env.local'])('ignores %s', (name) => {
    expect(gitignore).toContain(name);
  });

  it('ignores Firebase service account key files', () => {
    expect(gitignore).toContain('serviceAccount');
  });
});
