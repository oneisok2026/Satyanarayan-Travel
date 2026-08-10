import { z } from 'zod';

/**
 * Environment validation.
 *
 * Split deliberately into two schemas:
 *  - `clientEnv` reads only NEXT_PUBLIC_* values and is safe in the browser.
 *  - `serverEnv()` reads secrets and throws if imported/evaluated client-side.
 *
 * Next.js inlines NEXT_PUBLIC_* at build time only when referenced as full
 * literal `process.env.NEXT_PUBLIC_X` expressions, so they are written out
 * longhand below rather than looped over.
 */

const booleanish = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

// ---------------------------------------------------------------- client ----

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).default('Satyanarayan Travel'),

  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().default(''),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().default(''),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().default(''),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().default(''),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().default(''),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().default(''),
  NEXT_PUBLIC_ENABLE_GOOGLE_AUTH: booleanish,

  NEXT_PUBLIC_CONTACT_PHONE: z.string().default(''),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default(''),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().default(''),
});

const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_ENABLE_GOOGLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH,
  NEXT_PUBLIC_CONTACT_PHONE: process.env.NEXT_PUBLIC_CONTACT_PHONE,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
});

if (!parsedClient.success) {
  throw new Error(
    `Invalid public environment configuration:\n${formatIssues(parsedClient.error)}`,
  );
}

export const clientEnv = parsedClient.data;

/** True when the six Firebase Web SDK values are all present. */
export const isFirebaseClientConfigured =
  clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY !== '' &&
  clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== '' &&
  clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== '' &&
  clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID !== '';

// ---------------------------------------------------------------- server ----

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email('FIREBASE_CLIENT_EMAIL must be an email'),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1, 'FIREBASE_PRIVATE_KEY is required')
    // Dashboards and .env files store the key with literal \n sequences.
    .transform((key) => key.replace(/\\n/g, '\n'))
    .refine(
      (key) => key.includes('BEGIN PRIVATE KEY'),
      'FIREBASE_PRIVATE_KEY does not look like a PEM private key',
    ),

  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    ),
  MONGODB_DB_NAME: z.string().default('satyanarayan_travel'),

  SESSION_COOKIE_NAME: z.string().default('__session'),
  SESSION_COOKIE_DAYS: z.coerce.number().int().min(1).max(14).default(5),

  EMAIL_PROVIDER: z.enum(['resend', 'smtp', '']).default(''),
  EMAIL_FROM: z.string().default(''),
  EMAIL_ADMIN_RECIPIENTS: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | null = null;

/**
 * Validated server environment. Lazy so that a missing secret surfaces as a
 * clear error on first server use rather than crashing the whole build.
 */
export function serverEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() was called in the browser. This is a security bug.');
  }
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      'Invalid server environment configuration:\n' +
        formatIssues(parsed.error) +
        '\n\nCopy .env.example to .env.local and fill in the missing values.',
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/**
 * Non-throwing check used by health endpoints and startup diagnostics, so a
 * misconfigured deployment can report *what* is wrong instead of 500ing.
 */
export function checkServerEnv(): { ok: true } | { ok: false; problems: string[] } {
  const parsed = serverSchema.safeParse(process.env);
  if (parsed.success) return { ok: true };
  return {
    ok: false,
    problems: parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    ),
  };
}

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}
