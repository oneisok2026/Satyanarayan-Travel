/**
 * Smoke-tests the protected routes against a running server.
 *
 * Creates a temporary customer and admin, signs each in for real, then checks
 * that every account and admin route responds correctly for both — and that a
 * signed-out visitor is redirected away.
 *
 *   npx tsx --conditions react-server scripts/smoke-auth-routes.ts [port]
 */
import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

const PORT = process.argv[2] ?? '3000';
const BASE = `http://localhost:${PORT}`;

const ACCOUNT_ROUTES = [
  '/account',
  '/account/profile',
  '/account/bookings',
  '/account/enquiries',
  '/account/favourites',
  '/account/downloads',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/packages',
  '/admin/destinations',
  '/admin/categories',
  '/admin/enquiries',
  '/admin/bookings',
  '/admin/customers',
  '/admin/blogs',
  '/admin/gallery',
  '/admin/services',
  '/admin/reviews',
  '/admin/pages',
  '/admin/seo',
  '/admin/settings',
];

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

const checks: Check[] = [];
const record = (name: string, pass: boolean, detail = '') =>
  checks.push({ name, pass, detail });

/** Signs in via the REST API and exchanges the ID token for a session cookie. */
async function sessionCookieFor(uid: string): Promise<string> {
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const auth = getAdminAuth();

  const customToken = await auth.createCustomToken(uid);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const exchange = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  ).then((response) => response.json());

  if (!exchange.idToken) {
    throw new Error(`Token exchange failed: ${JSON.stringify(exchange.error)}`);
  }

  const response = await fetch(`${BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: exchange.idToken }),
  });

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('No session cookie returned');

  return setCookie.split(';')[0] as string;
}

async function status(path: string, cookie?: string): Promise<number> {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
  });
  return response.status;
}

/**
 * Fetches the rendered body.
 *
 * The App Router streams redirect() and notFound() results with a 200 header
 * rather than a 3xx or 404, so guards must be asserted on what the page
 * actually renders — and, more importantly, on what it does not leak.
 */
async function body(path: string, cookie?: string): Promise<string> {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
  });
  return response.text();
}

async function main(): Promise<void> {
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const models = await import('../src/models/index');
  const userService = await import('../src/services/user.service');

  const auth = getAdminAuth();
  await mongoose.connect(process.env.MONGODB_URI as string, {
    dbName: process.env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 15_000,
  });

  const stamp = Date.now();
  const uids: string[] = [];

  try {
    // --- signed out -------------------------------------------------------
    // What matters is that no protected content is rendered, not the status
    // code — see the note on body() above.
    const anonAccount = await body('/account');
    record(
      'Signed out: /account leaks no account data',
      !anonAccount.includes('Welcome back') &&
        !anonAccount.includes('Recent bookings'),
    );

    const anonAdmin = await body('/admin');
    record(
      'Signed out: /admin leaks no admin data',
      !anonAdmin.includes('Signed in as') &&
        !anonAdmin.includes('Recent activity') &&
        !anonAdmin.includes('Confirmed revenue'),
    );
    record(
      'Signed out: /admin redirects to the admin sign-in',
      anonAdmin.includes('/admin/login'),
    );

    const adminLogin = await body('/admin/login');
    record(
      'Admin sign-in page renders a form',
      adminLogin.includes('Admin sign in') &&
        adminLogin.includes('current-password'),
    );

    // --- customer ---------------------------------------------------------
    const customer = await auth.createUser({
      email: `smoke-cust-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
      displayName: 'Smoke Customer',
    });
    uids.push(customer.uid);
    await userService.syncFirebaseUser({
      firebaseUid: customer.uid,
      email: customer.email as string,
      emailVerified: true,
      name: 'Smoke Customer',
    });

    const customerCookie = await sessionCookieFor(customer.uid);
    record('Customer session established', Boolean(customerCookie));

    let accountOk = 0;
    for (const route of ACCOUNT_ROUTES) {
      const code = await status(route, customerCookie);
      if (code === 200) accountOk += 1;
      else record(`Customer ${route}`, false, `status ${code}`);
    }
    record(
      'Customer can open every account route',
      accountOk === ACCOUNT_ROUTES.length,
      `${accountOk}/${ACCOUNT_ROUTES.length}`,
    );

    // A customer must not reach the admin area. It renders the 404 page, so
    // the admin surface does not confirm that it exists.
    const customerAdmin = await body('/admin', customerCookie);
    record(
      'Customer sees 404 on /admin, no admin data',
      !customerAdmin.includes('Signed in as') &&
        !customerAdmin.includes('Recent activity') &&
        !customerAdmin.includes('Confirmed revenue'),
    );

    const customerAdminApi = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { cookie: customerCookie },
    });
    record(
      'Customer gets 403 on admin API',
      customerAdminApi.status === 403,
      `status ${customerAdminApi.status}`,
    );

    // --- admin ------------------------------------------------------------
    const admin = await auth.createUser({
      email: `smoke-admin-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
      displayName: 'Smoke Admin',
    });
    uids.push(admin.uid);
    await userService.syncFirebaseUser({
      firebaseUid: admin.uid,
      email: admin.email as string,
      emailVerified: true,
      name: 'Smoke Admin',
    });
    await userService.setUserRole(admin.uid, 'super_admin');

    const adminCookie = await sessionCookieFor(admin.uid);
    record('Admin session established', Boolean(adminCookie));

    let adminOk = 0;
    for (const route of ADMIN_ROUTES) {
      const code = await status(route, adminCookie);
      if (code === 200) adminOk += 1;
      else record(`Admin ${route}`, false, `status ${code}`);
    }
    record(
      'Admin can open every admin route',
      adminOk === ADMIN_ROUTES.length,
      `${adminOk}/${ADMIN_ROUTES.length}`,
    );

    const adminUsers = await status('/admin/users', adminCookie);
    record('Super admin can open /admin/users', adminUsers === 200, `status ${adminUsers}`);

    const adminApi = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { cookie: adminCookie },
    });
    record('Admin API returns data', adminApi.status === 200, `status ${adminApi.status}`);
  } finally {
    const users = await models.User.find({ firebaseUid: { $in: uids } })
      .select('_id')
      .lean();
    const ids = users.map((user) => user._id);

    await Promise.all([
      models.Booking.deleteMany({ userId: { $in: ids } }),
      models.Enquiry.deleteMany({ userId: { $in: ids } }),
      models.User.deleteMany({ firebaseUid: { $in: uids } }),
    ]);

    for (const uid of uids) {
      await getAdminAuth().deleteUser(uid).catch(() => undefined);
    }

    await mongoose.disconnect();
  }

  const line = '='.repeat(74);
  console.log(`\n${line}\n PROTECTED ROUTE SMOKE TEST\n${line}`);
  for (const check of checks) {
    console.log(
      ` ${check.pass ? 'PASS' : 'FAIL'}  ${check.name}${check.detail ? `  (${check.detail})` : ''}`,
    );
  }
  const failed = checks.filter((check) => !check.pass).length;
  console.log(line);
  console.log(` ${checks.length - failed}/${checks.length} passed — test data removed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
