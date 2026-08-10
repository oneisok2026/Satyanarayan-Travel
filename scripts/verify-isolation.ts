/**
 * Live verification of customer isolation and admin authorization.
 *
 * Creates two customers and one admin against the real Firebase project and
 * MongoDB cluster, drives the real service functions, then removes everything
 * it created.
 *
 *   npx tsx scripts/verify-isolation.ts
 */
import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

const checks: Check[] = [];
const record = (name: string, pass: boolean, detail = '') =>
  checks.push({ name, pass, detail });

async function main(): Promise<void> {
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const models = await import('../src/models/index');
  const bookingService = await import('../src/services/booking.service');
  const enquiryService = await import('../src/services/enquiry.service');
  const userService = await import('../src/services/user.service');

  const auth = getAdminAuth();

  await mongoose.connect(process.env.MONGODB_URI as string, {
    dbName: process.env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 15_000,
  });

  const stamp = Date.now();
  const created: { uids: string[]; packageId?: mongoose.Types.ObjectId } = { uids: [] };

  try {
    // --- fixtures -----------------------------------------------------------
    const alice = await auth.createUser({
      email: `iso-alice-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
      displayName: 'Alice Customer',
    });
    const bob = await auth.createUser({
      email: `iso-bob-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
      displayName: 'Bob Customer',
    });
    created.uids.push(alice.uid, bob.uid);

    const aliceUser = await userService.syncFirebaseUser({
      firebaseUid: alice.uid,
      email: alice.email as string,
      emailVerified: false,
      name: 'Alice Customer',
    });
    const bobUser = await userService.syncFirebaseUser({
      firebaseUid: bob.uid,
      email: bob.email as string,
      emailVerified: false,
      name: 'Bob Customer',
    });

    record('Two distinct MongoDB users created', String(aliceUser._id) !== String(bobUser._id));
    record('Both default to customer role', aliceUser.role === 'customer' && bobUser.role === 'customer');

    const pkg = await models.TourPackage.create({
      title: `Isolation Test Package ${stamp}`,
      slug: `isolation-test-${stamp}`,
      type: 'domestic',
      shortDescription: 'Temporary package used by the isolation verification script.',
      description: 'Temporary package used by the isolation verification script.',
      coverImage: { url: 'https://example.com/x.jpg', alt: 'Test' },
      duration: { nights: 3, days: 4 },
      price: 20_000,
      childPrice: 14_000,
      status: 'published',
    });
    created.packageId = pkg._id;

    // --- booking isolation --------------------------------------------------
    const aliceBooking = await bookingService.createBooking({
      userId: String(aliceUser._id),
      packageId: String(pkg._id),
      travelDate: new Date(Date.now() + 60 * 86_400_000),
      travellers: [{ name: 'Alice Customer', age: 30 }],
      contact: { name: 'Alice', email: alice.email as string, phone: '+919876543210' },
    });

    record('Booking created with server-side pricing', aliceBooking.pricingSnapshot.total === 21_000,
      `total=${aliceBooking.pricingSnapshot.total} (20000 + 5% tax)`);

    // Bob must not be able to read Alice's booking.
    let bobBlocked = false;
    try {
      await bookingService.getBooking(aliceBooking.id, {
        userId: String(bobUser._id),
        isAdmin: false,
      });
    } catch (error) {
      bobBlocked = (error as { code?: string }).code === 'NOT_FOUND';
    }
    record("Customer cannot read another customer's booking", bobBlocked, '404 NOT_FOUND');

    // Alice can read her own.
    const own = await bookingService.getBooking(aliceBooking.id, {
      userId: String(aliceUser._id),
      isAdmin: false,
    });
    record('Customer can read their own booking', own.id === aliceBooking.id);

    // Bob cannot cancel Alice's booking.
    let cancelBlocked = false;
    try {
      await bookingService.cancelOwnBooking(aliceBooking.id, String(bobUser._id));
    } catch (error) {
      cancelBlocked = (error as { code?: string }).code === 'NOT_FOUND';
    }
    record("Customer cannot cancel another customer's booking", cancelBlocked);

    // Listings are scoped per user.
    const bobList = await bookingService.listUserBookings(String(bobUser._id), 1, 20);
    record("Booking list excludes other customers' rows", bobList.total === 0, `bob sees ${bobList.total}`);

    const aliceList = await bookingService.listUserBookings(String(aliceUser._id), 1, 20);
    record('Booking list includes own rows', aliceList.total === 1);

    // --- idempotency --------------------------------------------------------
    const key = `iso-key-${stamp}`;
    const first = await bookingService.createBooking({
      userId: String(aliceUser._id),
      packageId: String(pkg._id),
      travelDate: new Date(Date.now() + 90 * 86_400_000),
      travellers: [{ name: 'Alice Customer', age: 30 }],
      contact: { name: 'Alice', email: alice.email as string, phone: '+919876543210' },
      idempotencyKey: key,
    });
    const replay = await bookingService.createBooking({
      userId: String(aliceUser._id),
      packageId: String(pkg._id),
      travelDate: new Date(Date.now() + 90 * 86_400_000),
      travellers: [{ name: 'Alice Customer', age: 30 }],
      contact: { name: 'Alice', email: alice.email as string, phone: '+919876543210' },
      idempotencyKey: key,
    });
    record('Retried booking is idempotent', first.bookingReference === replay.bookingReference,
      first.bookingReference);

    // --- status transitions -------------------------------------------------
    await bookingService.updateBookingStatus(aliceBooking.id, 'cancelled');
    let reopenBlocked = false;
    try {
      await bookingService.updateBookingStatus(aliceBooking.id, 'confirmed');
    } catch (error) {
      reopenBlocked = (error as { code?: string }).code === 'CONFLICT';
    }
    record('Cancelled booking cannot be reopened', reopenBlocked);

    // --- enquiry isolation --------------------------------------------------
    const guestEnquiry = await enquiryService.createEnquiry({
      type: 'package',
      name: 'Guest Visitor',
      email: 'guest@example.com',
      phone: '+919876543210',
      packageId: String(pkg._id),
      message: 'Guest enquiry from the isolation script.',
    });
    record('Guest can enquire without an account', !!guestEnquiry.referenceCode,
      guestEnquiry.referenceCode);

    await enquiryService.createEnquiry({
      type: 'package',
      name: 'Alice Customer',
      email: alice.email as string,
      phone: '+919876543210',
      packageId: String(pkg._id),
      userId: String(aliceUser._id),
    });

    const bobEnquiries = await enquiryService.listUserEnquiries(String(bobUser._id), 1, 20);
    record("Enquiry list excludes other customers' rows", bobEnquiries.total === 0);

    const aliceEnquiries = await enquiryService.listUserEnquiries(String(aliceUser._id), 1, 20);
    record('Enquiry list includes own rows', aliceEnquiries.total === 1);

    // --- admin authorization ------------------------------------------------
    const promoted = await userService.setUserRole(bob.uid, 'admin');
    record('Role promotion writes to MongoDB', promoted.role === 'admin');

    const adminView = await bookingService.getBooking(aliceBooking.id, {
      userId: String(bobUser._id),
      isAdmin: true,
    });
    record("Admin can read any customer's booking", adminView.id === aliceBooking.id);

    // A re-sync must not reset the elevated role.
    const resynced = await userService.syncFirebaseUser({
      firebaseUid: bob.uid,
      email: bob.email as string,
      emailVerified: false,
      name: 'Bob Customer',
    });
    record('Role survives re-authentication', resynced.role === 'admin');

    // Suspension must be enforced at the resolve chokepoint.
    await models.User.updateOne({ _id: bobUser._id }, { $set: { status: 'suspended' } });
    let suspendedBlocked = false;
    try {
      await userService.resolveAuthenticatedUser({
        uid: bob.uid,
        email: bob.email,
        email_verified: false,
      } as never);
    } catch (error) {
      suspendedBlocked = (error as { code?: string }).code === 'ACCOUNT_SUSPENDED';
    }
    record('Suspended account is refused', suspendedBlocked);
  } finally {
    // --- cleanup ------------------------------------------------------------
    const userIds = await models.User.find({ firebaseUid: { $in: created.uids } })
      .select('_id')
      .lean();
    const ids = userIds.map((u) => u._id);

    await Promise.all([
      models.Booking.deleteMany({ userId: { $in: ids } }),
      models.Enquiry.deleteMany({
        $or: [{ userId: { $in: ids } }, { email: 'guest@example.com' }],
      }),
      models.User.deleteMany({ firebaseUid: { $in: created.uids } }),
      created.packageId
        ? models.TourPackage.deleteOne({ _id: created.packageId })
        : Promise.resolve(),
    ]);

    for (const uid of created.uids) {
      await getAdminAuthSafe(uid);
    }

    await mongoose.disconnect();
  }

  const line = '='.repeat(74);
  console.log(`\n${line}\n CUSTOMER ISOLATION & ADMIN AUTHORIZATION\n${line}`);
  for (const check of checks) {
    console.log(
      ` ${check.pass ? 'PASS' : 'FAIL'}  ${check.name}${check.detail ? `  (${check.detail})` : ''}`,
    );
  }
  const failed = checks.filter((c) => !c.pass).length;
  console.log(line);
  console.log(` ${checks.length - failed}/${checks.length} passed — test data removed`);
  process.exit(failed > 0 ? 1 : 0);
}

async function getAdminAuthSafe(uid: string): Promise<void> {
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  await getAdminAuth().deleteUser(uid).catch(() => undefined);
}

main().catch((error) => {
  console.error('Isolation verification failed:', error);
  process.exit(1);
});
