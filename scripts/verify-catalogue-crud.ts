/**
 * Verifies catalogue CRUD and the status toggle against a running server.
 *
 * Signs in as a real admin and a real super admin, exercises every operation,
 * then removes everything it created.
 *
 *   npx tsx --conditions react-server scripts/verify-catalogue-crud.ts [port]
 */
import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

const PORT = process.argv[2] ?? '3000';
const BASE = `http://localhost:${PORT}`;

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

const checks: Check[] = [];
const record = (name: string, pass: boolean, detail = '') =>
  checks.push({ name, pass, detail });

async function sessionCookieFor(uid: string): Promise<string> {
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const auth = getAdminAuth();

  const customToken = await auth.createCustomToken(uid);
  const exchange = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  ).then((response) => response.json());

  const response = await fetch(`${BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: exchange.idToken }),
  });

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('No session cookie returned');
  return setCookie.split(';')[0] as string;
}

async function api(
  method: string,
  path: string,
  cookie: string,
  payload?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { cookie, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
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
  let createdId: string | null = null;

  try {
    // --- fixtures ---------------------------------------------------------
    const plainAdmin = await auth.createUser({
      email: `crud-admin-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
    });
    uids.push(plainAdmin.uid);
    await userService.syncFirebaseUser({
      firebaseUid: plainAdmin.uid,
      email: plainAdmin.email as string,
      emailVerified: true,
      name: 'Plain Admin',
    });
    await userService.setUserRole(plainAdmin.uid, 'admin');

    const superAdmin = await auth.createUser({
      email: `crud-super-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
    });
    uids.push(superAdmin.uid);
    await userService.syncFirebaseUser({
      firebaseUid: superAdmin.uid,
      email: superAdmin.email as string,
      emailVerified: true,
      name: 'Super Admin',
    });
    await userService.setUserRole(superAdmin.uid, 'super_admin');

    const adminCookie = await sessionCookieFor(plainAdmin.uid);
    const superCookie = await sessionCookieFor(superAdmin.uid);

    // --- create -----------------------------------------------------------
    const payload = {
      name: `CRUD Test Category ${stamp}`,
      slug: `crud-test-category-${stamp}`,
      description: 'Temporary category created by the CRUD verification script.',
      status: 'published',
      featured: false,
      sortOrder: 99,
    };

    const adminCreate = await api('POST', '/api/admin/catalogue/categories', adminCookie, payload);
    record('Plain admin cannot create', adminCreate.status === 403, `status ${adminCreate.status}`);

    const superCreate = await api('POST', '/api/admin/catalogue/categories', superCookie, payload);
    record('Super admin can create', superCreate.status === 201, `status ${superCreate.status}`);

    const item = (superCreate.body.data as Record<string, unknown> | undefined)?.item as
      | Record<string, unknown>
      | undefined;
    createdId = item ? String(item._id) : null;

    if (!createdId) throw new Error('Create did not return an id');

    // --- duplicate slug ---------------------------------------------------
    const duplicate = await api('POST', '/api/admin/catalogue/categories', superCookie, payload);
    record('Duplicate slug rejected', duplicate.status === 409, `status ${duplicate.status}`);

    // --- status toggle ----------------------------------------------------
    const hide = await api(
      'PATCH',
      `/api/admin/catalogue/categories/${createdId}`,
      adminCookie,
      { status: 'archived' },
    );
    record('Plain admin can hide (status toggle)', hide.status === 200, `status ${hide.status}`);

    const hidden = await models.Category.findById(createdId).lean();
    record('Status persisted as archived', hidden?.status === 'archived', `status=${hidden?.status}`);

    const publish = await api(
      'PATCH',
      `/api/admin/catalogue/categories/${createdId}`,
      adminCookie,
      { status: 'published' },
    );
    record('Plain admin can publish', publish.status === 200, `status ${publish.status}`);

    // --- content edit -----------------------------------------------------
    const adminEdit = await api(
      'PATCH',
      `/api/admin/catalogue/categories/${createdId}`,
      adminCookie,
      { ...payload, name: 'Renamed by plain admin' },
    );
    record('Plain admin cannot edit content', adminEdit.status === 403, `status ${adminEdit.status}`);

    const superEdit = await api(
      'PATCH',
      `/api/admin/catalogue/categories/${createdId}`,
      superCookie,
      { ...payload, name: `Renamed ${stamp}` },
    );
    record('Super admin can edit content', superEdit.status === 200, `status ${superEdit.status}`);

    const renamed = await models.Category.findById(createdId).lean();
    record('Edit persisted', renamed?.name === `Renamed ${stamp}`, renamed?.name);

    // --- unknown field rejected -------------------------------------------
    const injected = await api(
      'PATCH',
      `/api/admin/catalogue/categories/${createdId}`,
      superCookie,
      { ...payload, createdAt: '1970-01-01', __proto__: { admin: true } },
    );
    record(
      'Unknown fields rejected by strict schema',
      injected.status === 422,
      `status ${injected.status}`,
    );

    // --- delete guard on referenced data ----------------------------------
    const seeded = await models.TourPackage.findOne({ status: 'published' })
      .select('_id destinationIds')
      .lean();

    if (seeded?.destinationIds?.[0]) {
      const destinationId = String(seeded.destinationIds[0]);
      const guarded = await api(
        'DELETE',
        `/api/admin/catalogue/destinations/${destinationId}`,
        superCookie,
      );
      record(
        'Delete refused for a destination in use',
        guarded.status === 409,
        `status ${guarded.status}`,
      );
    }

    // --- delete -----------------------------------------------------------
    const adminDelete = await api(
      'DELETE',
      `/api/admin/catalogue/categories/${createdId}`,
      adminCookie,
    );
    record('Plain admin cannot delete', adminDelete.status === 403, `status ${adminDelete.status}`);

    const superDelete = await api(
      'DELETE',
      `/api/admin/catalogue/categories/${createdId}`,
      superCookie,
    );
    record('Super admin can delete', superDelete.status === 200, `status ${superDelete.status}`);

    const gone = await models.Category.findById(createdId).lean();
    record('Record removed from the database', gone === null);
    if (gone === null) createdId = null;

    // --- audit trail ------------------------------------------------------
    const audits = await models.AuditLog.countDocuments({
      entityType: 'Category',
      action: { $in: ['categories.created', 'categories.updated', 'categories.deleted', 'categories.status_changed'] },
    });
    record('Actions written to the audit log', audits > 0, `${audits} entries`);
  } finally {
    if (createdId) {
      await models.Category.deleteOne({ _id: createdId }).catch(() => undefined);
    }

    const users = await models.User.find({ firebaseUid: { $in: uids } })
      .select('_id')
      .lean();
    const ids = users.map((user) => user._id);

    await Promise.all([
      models.AuditLog.deleteMany({ actorId: { $in: ids } }),
      models.User.deleteMany({ firebaseUid: { $in: uids } }),
    ]);

    for (const uid of uids) {
      await getAdminAuth().deleteUser(uid).catch(() => undefined);
    }

    await mongoose.disconnect();
  }

  const line = '='.repeat(74);
  console.log(`\n${line}\n CATALOGUE CRUD & STATUS TOGGLE\n${line}`);
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
  console.error('Verification failed:', error);
  process.exit(1);
});
