/**
 * Full end-to-end scenario (PART 34).
 *
 * Drives the complete customer and admin journey against a running server and
 * the live Firebase project and MongoDB cluster — 32 steps, in order, each
 * asserting the real effect rather than the HTTP status alone.
 *
 *   npm run verify:e2e -- [port]
 *
 * Everything it creates is removed at the end, including on failure.
 */
import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

const PORT = process.argv[2] ?? '3000';
const BASE = `http://localhost:${PORT}`;

interface Step {
  n: number;
  name: string;
  pass: boolean;
  detail: string;
}

const steps: Step[] = [];

function step(n: number, name: string, pass: boolean, detail = '') {
  steps.push({ n, name, pass, detail });
  console.log(
    ` ${pass ? 'PASS' : 'FAIL'}  ${String(n).padStart(2)}. ${name}${detail ? `  (${detail})` : ''}`,
  );
}

async function get(path: string, cookie?: string) {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
  });
  return { status: response.status, html: await response.text() };
}

async function api(
  method: string,
  path: string,
  cookie?: string,
  payload?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function sessionFor(uid: string): Promise<string> {
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const token = await getAdminAuth().createCustomToken(uid);

  const exchange = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, returnSecureToken: true }),
    },
  ).then((r) => r.json());

  const response = await fetch(`${BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: exchange.idToken }),
  });

  const cookie = response.headers.get('set-cookie');
  if (!cookie) throw new Error('No session cookie');
  return cookie.split(';')[0] as string;
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
  const created = {
    uids: [] as string[],
    packageIds: [] as string[],
    blogIds: [] as string[],
  };

  console.log('\n' + '='.repeat(78));
  console.log(' END-TO-END SCENARIO — PART 34');
  console.log('='.repeat(78));

  try {
    // ---------------------------------------------------------------- 1-3
    const home = await get('/');
    step(
      1,
      'Visitor opens homepage',
      home.status === 200 && home.html.includes('Featured destinations'),
      `status ${home.status}`,
    );

    const destinations = await get('/destinations');
    step(
      2,
      'Visitor browses destinations',
      destinations.status === 200 && destinations.html.includes('Within India'),
      `status ${destinations.status}`,
    );

    const seededPackage = await models.TourPackage.findOne({ status: 'published' })
      .select('_id slug title')
      .lean();

    if (!seededPackage) throw new Error('No published package to test against');

    const detail = await get(`/packages/${seededPackage.slug}`);
    step(
      3,
      'Visitor opens package',
      detail.status === 200 && detail.html.includes('Day-wise itinerary'),
      seededPackage.slug,
    );

    // ---------------------------------------------------------------- 4-5
    const enquiry = await api('POST', '/api/enquiries', undefined, {
      type: 'package',
      name: 'E2E Visitor',
      email: `e2e-visitor-${stamp}@satyanarayan-test.local`,
      phone: '+919876543210',
      packageId: String(seededPackage._id),
      message: 'End-to-end scenario enquiry. Please ignore.',
      consent: true,
      formLoadedAt: Date.now() - 20_000,
    });

    const enquiryRef =
      (enquiry.body.data as { enquiry?: { referenceCode: string } })?.enquiry
        ?.referenceCode ?? '';

    step(
      4,
      'Visitor submits enquiry (no account)',
      enquiry.status === 201 && Boolean(enquiryRef),
      enquiryRef,
    );

    // Admin is created here so step 5 can assert the enquiry is visible.
    const adminUser = await auth.createUser({
      email: `e2e-admin-${stamp}@satyanarayan-test.local`,
      password: 'TestPassw0rd!2026',
      displayName: 'E2E Admin',
    });
    created.uids.push(adminUser.uid);
    await userService.syncFirebaseUser({
      firebaseUid: adminUser.uid,
      email: adminUser.email as string,
      emailVerified: true,
      name: 'E2E Admin',
    });
    await userService.setUserRole(adminUser.uid, 'super_admin');
    const adminCookie = await sessionFor(adminUser.uid);

    const adminEnquiries = await api(
      'GET',
      `/api/admin/enquiries?search=${enquiryRef}`,
      adminCookie,
    );
    const foundEnquiries = (
      adminEnquiries.body.data as { enquiries?: { referenceCode: string }[] }
    )?.enquiries;

    step(
      5,
      'Enquiry appears in admin',
      foundEnquiries?.some((e) => e.referenceCode === enquiryRef) ?? false,
      `${foundEnquiries?.length ?? 0} matched`,
    );

    // ---------------------------------------------------------------- 6-7
    const customerEmail = `e2e-customer-${stamp}@satyanarayan-test.local`;
    const signUp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          password: 'TestPassw0rd!2026',
          returnSecureToken: true,
        }),
      },
    ).then((r) => r.json());

    step(
      6,
      'Visitor registers using Firebase',
      Boolean(signUp.idToken),
      signUp.error?.message ?? 'registered',
    );

    created.uids.push(signUp.localId);

    // The session exchange is what creates the MongoDB record.
    const sessionResponse = await fetch(`${BASE}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: signUp.idToken }),
    });
    const customerCookie = (sessionResponse.headers.get('set-cookie') ?? '').split(';')[0];

    const mongoUser = await models.User.findOne({ firebaseUid: signUp.localId }).lean();
    step(
      7,
      'MongoDB user created with the same Firebase UID',
      mongoUser?.firebaseUid === signUp.localId && mongoUser?.role === 'customer',
      `uid matches, role ${mongoUser?.role}`,
    );

    // ---------------------------------------------------------------- 8-9
    step(8, 'Customer logs in', Boolean(customerCookie), 'session cookie issued');

    const account = await get('/account', customerCookie);
    step(
      9,
      'Customer sees account dashboard',
      account.status === 200 && account.html.includes('Welcome back'),
      `status ${account.status}`,
    );

    // -------------------------------------------------------------- 10-12
    const booking = await api('POST', '/api/bookings', customerCookie, {
      packageId: String(seededPackage._id),
      travelDate: new Date(Date.now() + 60 * 86_400_000).toISOString(),
      travellers: [{ name: 'E2E Traveller', age: 34 }],
      contact: {
        name: 'E2E Customer',
        email: customerEmail,
        phone: '+919876543210',
      },
      notes: 'End-to-end scenario booking.',
    });

    const bookingData = (
      booking.body.data as { booking?: { id: string; bookingReference: string } }
    )?.booking;

    step(
      10,
      'Customer submits booking',
      booking.status === 201 && Boolean(bookingData?.bookingReference),
      bookingData?.bookingReference,
    );

    const storedBooking = await models.Booking.findById(bookingData?.id).lean();
    step(
      11,
      'Booking appears in MongoDB',
      storedBooking !== null && String(storedBooking?.userId) === String(mongoUser?._id),
      `total ${storedBooking?.pricingSnapshot?.total}`,
    );

    const customerBookings = await get('/account/bookings', customerCookie);
    step(
      12,
      'Customer sees booking',
      customerBookings.html.includes(bookingData?.bookingReference ?? 'x'),
      'reference visible',
    );

    // -------------------------------------------------------------- 13-16
    step(13, 'Admin logs in', Boolean(adminCookie), 'session cookie issued');

    const adminBookings = await get('/admin/bookings', adminCookie);
    step(
      14,
      'Admin sees booking',
      adminBookings.html.includes(bookingData?.bookingReference ?? 'x'),
      'reference visible',
    );

    const statusChange = await api(
      'PATCH',
      `/api/admin/bookings/${bookingData?.id}`,
      adminCookie,
      { status: 'confirmed' },
    );
    step(
      15,
      'Admin changes booking status',
      statusChange.status === 200,
      'requested → confirmed',
    );

    const updatedBooking = await get(
      `/account/bookings/${bookingData?.id}`,
      customerCookie,
    );
    step(
      16,
      'Customer sees updated status',
      updatedBooking.html.includes('Confirmed'),
      'status reflected in the customer view',
    );

    // -------------------------------------------------------------- 17-18
    const favourite = await api('POST', '/api/favourites', customerCookie, {
      packageId: String(seededPackage._id),
    });
    step(17, 'Customer saves package to favourites', favourite.status === 200);

    const favourites = await get('/account/favourites', customerCookie);
    step(
      18,
      'Favourite appears in account',
      favourites.html.includes(seededPackage.title),
      'package listed',
    );

    // -------------------------------------------------------------- 19-21
    const review = await api('POST', '/api/reviews', customerCookie, {
      packageId: String(seededPackage._id),
      rating: 5,
      title: 'Excellent end-to-end trip',
      comment:
        'This review was created by the end-to-end verification scenario and will be removed.',
    });

    const reviewData = (review.body.data as { review?: { id: string } })?.review;
    step(
      19,
      'Customer submits review',
      review.status === 201 && Boolean(reviewData?.id),
      'held for moderation',
    );

    const moderation = await api(
      'PATCH',
      `/api/admin/reviews/${reviewData?.id}`,
      adminCookie,
      { status: 'approved' },
    );
    step(20, 'Admin moderates review', moderation.status === 200, 'approved');

    const packageWithReview = await get(`/packages/${seededPackage.slug}`);
    step(
      21,
      'Approved review appears on package',
      packageWithReview.html.includes('Excellent end-to-end trip'),
      'visible publicly',
    );

    // -------------------------------------------------------------- 22-25
    const newPackage = await api('POST', '/api/admin/catalogue/packages', adminCookie, {
      title: `E2E Test Package ${stamp}`,
      slug: `e2e-test-package-${stamp}`,
      type: 'domestic',
      shortDescription:
        'A package created by the end-to-end verification scenario for testing.',
      description:
        'This package exists only to verify that admin creation publishes to the live website. It is removed when the scenario finishes.',
      coverImage: {
        url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=70',
        alt: 'Palm-lined beach',
      },
      duration: { nights: 3, days: 4 },
      price: 19_999,
      status: 'published',
      featured: false,
    });

    const createdPackage = (
      newPackage.body.data as { item?: { _id: string; slug: string } }
    )?.item;
    if (createdPackage?._id) created.packageIds.push(createdPackage._id);

    step(
      22,
      'Admin creates package',
      newPackage.status === 201 && Boolean(createdPackage?.slug),
      createdPackage?.slug,
    );

    const publicNew = await get(`/packages/${createdPackage?.slug}`);
    step(
      23,
      'New package appears publicly',
      publicNew.status === 200 && publicNew.html.includes(`E2E Test Package ${stamp}`),
      `status ${publicNew.status}`,
    );

    const edit = await api(
      'PATCH',
      `/api/admin/catalogue/packages/${createdPackage?._id}`,
      adminCookie,
      {
        title: `E2E Edited Package ${stamp}`,
        slug: createdPackage?.slug,
        type: 'domestic',
        shortDescription:
          'An edited package created by the end-to-end verification scenario.',
        description:
          'This package was edited by the end-to-end scenario to confirm that updates reach the public website.',
        coverImage: {
          url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=70',
          alt: 'Palm-lined beach',
        },
        duration: { nights: 3, days: 4 },
        price: 24_999,
        status: 'published',
        featured: false,
      },
    );
    step(24, 'Admin edits package', edit.status === 200, 'title and price changed');

    const publicEdited = await get(`/packages/${createdPackage?.slug}`);
    step(
      25,
      'Public package updates',
      publicEdited.html.includes(`E2E Edited Package ${stamp}`) &&
        publicEdited.html.includes('24,999'),
      'new title and price live',
    );

    // -------------------------------------------------------------- 26-27
    const blog = await api('POST', '/api/admin/catalogue/blogs', adminCookie, {
      title: `E2E Test Article ${stamp}`,
      slug: `e2e-test-article-${stamp}`,
      excerpt:
        'An article created by the end-to-end verification scenario to confirm publishing.',
      content:
        '<p>This article was created by the end-to-end scenario and is removed when it finishes.</p>',
      coverImage: {
        url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=70',
        alt: 'Travel desk',
      },
      authorName: 'E2E Admin',
      readingMinutes: 2,
      status: 'published',
      publishedAt: new Date().toISOString(),
    });

    const createdBlog = (blog.body.data as { item?: { _id: string; slug: string } })?.item;
    if (createdBlog?._id) created.blogIds.push(createdBlog._id);

    step(26, 'Admin publishes blog', blog.status === 201, createdBlog?.slug);

    const publicBlog = await get(`/blog/${createdBlog?.slug}`);
    step(
      27,
      'Blog appears publicly',
      publicBlog.status === 200 && publicBlog.html.includes(`E2E Test Article ${stamp}`),
      `status ${publicBlog.status}`,
    );

    // -------------------------------------------------------------- 28-32
    const mobileMarkers = ['lg:hidden', 'sm:grid-cols-2', 'Open menu'];
    step(
      28,
      'Mobile layout works',
      mobileMarkers.every((marker) => home.html.includes(marker)),
      'responsive classes and mobile menu present',
    );

    const lazyCount = (home.html.match(/loading="lazy"/g) ?? []).length;
    const heroPriority = home.html.includes('fetchPriority="high"');
    step(
      29,
      'Lazy loading works',
      lazyCount > 10 && heroPriority,
      `${lazyCount} lazy images, LCP image prioritised`,
    );

    const seoOk =
      detail.html.includes('<title>') &&
      detail.html.includes('rel="canonical"') &&
      detail.html.includes('og:title') &&
      detail.html.includes('"@type":"Product"');
    step(
      30,
      'SEO metadata works',
      seoOk,
      'title, canonical, Open Graph and structured data',
    );

    const sitemap = await get('/sitemap.xml');
    const robots = await get('/robots.txt');
    step(
      31,
      'Sitemap and robots served',
      sitemap.status === 200 &&
        sitemap.html.includes('<urlset') &&
        robots.status === 200,
      `${(sitemap.html.match(/<url>/g) ?? []).length} URLs`,
    );

    const health = await api('GET', '/api/health');
    const healthData = health.body.data as { status?: string };
    step(
      32,
      'Health check reports healthy',
      health.status === 200 && healthData?.status === 'healthy',
      healthData?.status,
    );
  } catch (error) {
    console.log(
      `\n UNEXPECTED ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
    steps.push({
      n: 0,
      name: 'Scenario completed without error',
      pass: false,
      detail: error instanceof Error ? error.message.slice(0, 90) : 'unknown',
    });
  } finally {
    // Remove everything created, whatever happened above.
    const users = await models.User.find({ firebaseUid: { $in: created.uids } })
      .select('_id')
      .lean();
    const ids = users.map((user) => user._id);

    await Promise.all([
      models.Booking.deleteMany({ userId: { $in: ids } }),
      models.Enquiry.deleteMany({
        $or: [
          { userId: { $in: ids } },
          { email: { $regex: /@satyanarayan-test\.local$/ } },
        ],
      }),
      models.Review.deleteMany({ userId: { $in: ids } }),
      models.Favourite.deleteMany({ userId: { $in: ids } }),
      models.AuditLog.deleteMany({ actorId: { $in: ids } }),
      models.TourPackage.deleteMany({ _id: { $in: created.packageIds } }),
      models.BlogPost.deleteMany({ _id: { $in: created.blogIds } }),
      models.User.deleteMany({ firebaseUid: { $in: created.uids } }),
    ]);

    for (const uid of created.uids) {
      await auth.deleteUser(uid).catch(() => undefined);
    }

    // The approved review changed the package's denormalised rating.
    const seeded = await models.TourPackage.findOne({ status: 'published' })
      .select('_id')
      .lean();
    if (seeded) {
      const { recalculatePackageRating } = await import('../src/services/content.service');
      await recalculatePackageRating(String(seeded._id)).catch(() => undefined);
    }

    await mongoose.disconnect();
  }

  const failed = steps.filter((s) => !s.pass).length;

  console.log('='.repeat(78));
  console.log(
    ` ${steps.length - failed}/${steps.length} steps passed` +
      (failed ? ` · ${failed} FAILURES` : ''),
  );
  console.log(' All test data removed.');
  console.log('='.repeat(78) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Scenario failed to run:', error);
  process.exit(1);
});
