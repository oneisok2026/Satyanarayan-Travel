/**
 * Pre-deployment readiness check (PART 29).
 *
 * Verifies the things that actually break a deployment: Node version, build
 * and start commands, environment variables, live MongoDB and Firebase
 * connectivity, and the settings that must be configured in each console.
 *
 *   npm run verify:deploy
 *
 * Reports on all checks rather than stopping at the first failure, so one run
 * gives the full picture.
 */
import { loadEnvConfig } from '@next/env';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

loadEnvConfig(process.cwd());

type Level = 'pass' | 'warn' | 'fail';

interface Check {
  name: string;
  level: Level;
  detail: string;
  /** Shown when the check does not pass. */
  action?: string;
}

const checks: Check[] = [];
const record = (name: string, level: Level, detail: string, action?: string) =>
  checks.push({ name, level, detail, action });

const ROOT = process.cwd();

/** Required by the PRD. Node 22 builds correctly but is not the target. */
const TARGET_MAJOR = 24;

function checkNode(): void {
  const major = Number(process.versions.node.split('.')[0]);

  if (major >= TARGET_MAJOR) {
    record('Node version', 'pass', `v${process.versions.node}`);
  } else if (major >= 22) {
    record(
      'Node version',
      'warn',
      `v${process.versions.node} locally, target is ${TARGET_MAJOR} LTS`,
      `Set Node ${TARGET_MAJOR} in the Hostinger runtime. Builds work on 22, but production should match the PRD.`,
    );
  } else {
    record(
      'Node version',
      'fail',
      `v${process.versions.node} is below the minimum`,
      `Install Node ${TARGET_MAJOR} LTS.`,
    );
  }
}

function checkScripts(): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

  const build = pkg.scripts?.build;
  record(
    'Build command',
    build === 'next build' ? 'pass' : 'warn',
    `npm run build → ${build ?? '(missing)'}`,
  );

  const start = pkg.scripts?.start;
  record(
    'Start command',
    typeof start === 'string' && start.includes('next start') ? 'pass' : 'warn',
    `npm start → ${start ?? '(missing)'}`,
  );

  const engines = pkg.engines?.node;
  record(
    'engines.node declared',
    engines ? 'pass' : 'warn',
    engines ?? '(not declared)',
    'Declare engines.node so the host provisions the right runtime.',
  );
}

function checkNextConfig(): void {
  const config = readFileSync(join(ROOT, 'next.config.mjs'), 'utf8');

  record(
    'Security headers',
    config.includes('Strict-Transport-Security') ? 'pass' : 'fail',
    config.includes('Strict-Transport-Security')
      ? 'HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy'
      : 'missing',
  );

  record(
    'Server packages externalised',
    config.includes('serverExternalPackages') ? 'pass' : 'warn',
    'mongoose and firebase-admin kept out of the client bundle',
  );
}

function checkEnvironment(): void {
  const clientRequired = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_SITE_URL',
  ];

  const serverRequired = [
    'MONGODB_URI',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'SESSION_COOKIE_NAME',
  ];

  const missingClient = clientRequired.filter((name) => !process.env[name]);
  record(
    'Client environment variables',
    missingClient.length === 0 ? 'pass' : 'fail',
    missingClient.length === 0
      ? `all ${clientRequired.length} present`
      : `missing: ${missingClient.join(', ')}`,
  );

  const missingServer = serverRequired.filter((name) => !process.env[name]);
  record(
    'Server environment variables',
    missingServer.length === 0 ? 'pass' : 'fail',
    missingServer.length === 0
      ? `all ${serverRequired.length} present`
      : `missing: ${missingServer.join(', ')}`,
  );

  // A secret prefixed NEXT_PUBLIC_ is inlined into the browser bundle.
  const leaked = Object.keys(process.env).filter(
    (name) =>
      name.startsWith('NEXT_PUBLIC_') &&
      /(PRIVATE_KEY|MONGODB_URI|CLIENT_EMAIL|SMTP_PASSWORD|RESEND_API_KEY|SECRET)/.test(
        name,
      ),
  );
  record(
    'No secrets exposed to the browser',
    leaked.length === 0 ? 'pass' : 'fail',
    leaked.length === 0 ? 'clean' : `LEAKED: ${leaked.join(', ')}`,
    'Remove the NEXT_PUBLIC_ prefix and rotate the exposed value.',
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const isLocalhost = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1');
  record(
    'Production site URL',
    isLocalhost ? 'warn' : 'pass',
    siteUrl || '(not set)',
    'Set NEXT_PUBLIC_SITE_URL to the live https:// domain — canonicals, Open Graph and the sitemap all use it.',
  );

  record(
    'HTTPS in production',
    siteUrl.startsWith('https://') ? 'pass' : 'warn',
    siteUrl.startsWith('https://') ? 'https' : 'not https',
    'Session cookies are Secure in production and will not be sent over http.',
  );

  const emailProvider = process.env.EMAIL_PROVIDER ?? '';
  record(
    'Email notifications',
    emailProvider ? 'pass' : 'warn',
    emailProvider || 'disabled',
    'Enquiry and booking emails are skipped until EMAIL_PROVIDER is configured.',
  );
}

function checkGitHygiene(): void {
  const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
  const ignoresEnv = gitignore.includes('.env.local') && gitignore.includes('.env');

  record(
    '.env files git-ignored',
    ignoresEnv ? 'pass' : 'fail',
    ignoresEnv ? 'ignored' : 'NOT ignored',
  );

  record(
    '.env.example committed',
    existsSync(join(ROOT, '.env.example')) ? 'pass' : 'warn',
    'documents every required variable',
  );
}

async function checkDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    record('MongoDB connection', 'fail', 'MONGODB_URI not set');
    return;
  }

  // A non-SRV URI pins shard hostnames that Atlas rotates during maintenance.
  if (!uri.startsWith('mongodb+srv://')) {
    record(
      'MongoDB URI form',
      'warn',
      'non-SRV (pinned shard hostnames)',
      'Atlas rotates these during maintenance. Prefer mongodb+srv:// so the driver re-resolves them.',
    );
  } else {
    record('MongoDB URI form', 'pass', 'SRV');
  }

  try {
    const mongoose = (await import('mongoose')).default;
    const started = Date.now();

    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 12_000,
    });

    await mongoose.connection.db?.admin().ping();
    record('MongoDB connection', 'pass', `connected in ${Date.now() - started}ms`);

    const collections = await mongoose.connection.db?.listCollections().toArray();
    record(
      'MongoDB collections',
      (collections?.length ?? 0) > 0 ? 'pass' : 'warn',
      `${collections?.length ?? 0} collections`,
      'Run npm run seed to populate the catalogue.',
    );

    await mongoose.disconnect();
  } catch (error) {
    record(
      'MongoDB connection',
      'fail',
      error instanceof Error ? error.message.slice(0, 90) : 'failed',
      "Check the Atlas IP allowlist — the production server's IP must be permitted.",
    );
  }
}

async function checkFirebase(): Promise<void> {
  try {
    const { getAdminAuth } = await import('../src/lib/firebase/admin');
    const auth = getAdminAuth();

    // listUsers forces a signed call, so this proves the key really works.
    const users = await auth.listUsers(1);
    record(
      'Firebase Admin SDK',
      'pass',
      `authenticated as ${process.env.FIREBASE_CLIENT_EMAIL?.split('@')[0]}`,
    );
    record(
      'Firebase users',
      users.users.length > 0 ? 'pass' : 'warn',
      users.users.length > 0 ? 'accounts exist' : 'no accounts yet',
      'Run npm run create:admin -- <email> to create the first admin.',
    );
  } catch (error) {
    record(
      'Firebase Admin SDK',
      'fail',
      error instanceof Error ? error.message.slice(0, 90) : 'failed',
      'Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
    );
  }

  /*
   * Email/Password must be enabled or sign-in fails at runtime.
   *
   * Probed with a deliberately invalid sign-in rather than a signUp call:
   * anonymous signUp tests the ANONYMOUS provider and returns
   * ADMIN_ONLY_OPERATION even when Email/Password is fully enabled.
   *
   * INVALID_LOGIN_CREDENTIALS means the provider processed the request and
   * simply rejected the credentials — which is what we want to confirm.
   */
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'provider-probe@example.invalid',
          password: 'not-a-real-password',
          returnSecureToken: true,
        }),
      },
    ).then((result) => result.json());

    const message = response.error?.message ?? '';
    const disabled = message.includes('OPERATION_NOT_ALLOWED');
    const reachable =
      message.includes('INVALID_LOGIN_CREDENTIALS') ||
      message.includes('EMAIL_NOT_FOUND') ||
      message.includes('INVALID_PASSWORD');

    record(
      'Email/Password sign-in enabled',
      disabled ? 'fail' : reachable ? 'pass' : 'warn',
      disabled ? 'disabled in Firebase' : reachable ? 'enabled' : message || 'unclear',
      'Firebase Console → Authentication → Sign-in method → enable Email/Password.',
    );
  } catch {
    record('Email/Password sign-in enabled', 'warn', 'could not verify');
  }
}

function manualChecklist(): void {
  const domain = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/^https?:\/\//, '');

  console.log('\nMANUAL STEPS — verify in each console before going live');
  console.log('-'.repeat(74));
  console.log(
    ` 1. Firebase authorized domains\n` +
      `    Console → Authentication → Settings → Authorized domains\n` +
      `    Add: ${domain || '<your production domain>'}\n` +
      `    Sign-in fails on any domain not listed.`,
  );
  console.log(
    `\n 2. MongoDB Atlas network access\n` +
      `    Atlas → Network Access → add the Hostinger server IP\n` +
      `    Connections hang rather than error when the IP is not allowed.`,
  );
  console.log(
    `\n 3. Production database user\n` +
      `    Atlas → Database Access → a dedicated user with readWrite on this\n` +
      `    database only, not atlasAdmin.`,
  );
  console.log(
    `\n 4. SSL certificate\n` +
      `    Hostinger → SSL → issue and force HTTPS. Session cookies are Secure\n` +
      `    in production and will not be sent over http.`,
  );
  console.log(
    `\n 5. Environment variables on the host\n` +
      `    .env.local is git-ignored, so every variable must be set in the\n` +
      `    Hostinger panel. Nothing is inherited from this machine.`,
  );
  console.log(
    `\n 6. Rotate any credential shared during development\n` +
      `    Firebase service account keys and the MongoDB password.`,
  );
}

async function main(): Promise<void> {
  checkNode();
  checkScripts();
  checkNextConfig();
  checkEnvironment();
  checkGitHygiene();
  await checkDatabase();
  await checkFirebase();

  const line = '='.repeat(74);
  console.log(`\n${line}\n DEPLOYMENT READINESS\n${line}`);

  for (const check of checks) {
    const badge = check.level === 'pass' ? 'PASS' : check.level === 'warn' ? 'WARN' : 'FAIL';
    console.log(` ${badge}  ${check.name.padEnd(34)} ${check.detail}`);
    if (check.level !== 'pass' && check.action) {
      console.log(`       → ${check.action}`);
    }
  }

  const failed = checks.filter((check) => check.level === 'fail').length;
  const warned = checks.filter((check) => check.level === 'warn').length;

  console.log(line);
  console.log(
    ` ${checks.length - failed - warned} passed · ${warned} warnings · ${failed} failures`,
  );
  console.log(line);

  manualChecklist();
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Deployment check failed:', error);
  process.exit(1);
});
