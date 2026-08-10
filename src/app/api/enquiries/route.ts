import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { createEnquirySchema } from '@/lib/validation/enquiry.schema';
import { paginationSchema, searchParamsToObject } from '@/lib/validation/common.schema';
import { createEnquiry, listUserEnquiries } from '@/services/enquiry.service';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { assertNotSpam } from '@/lib/security/spam';
import { getCurrentUser, requireUser } from '@/lib/firebase/auth';
import { notifyEnquiryCreated } from '@/services/notification.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/enquiries — public. Accepts guests and signed-in customers.
 *
 * When a session exists the enquiry is linked to that user, taken from the
 * verified cookie rather than any userId in the body.
 */
export const POST = route('POST /api/enquiries', async (request: NextRequest) => {
  const ip = getClientIp(request);
  enforceRateLimit('enquiry', ip);

  const body = await readJsonBody(request);
  const input = createEnquirySchema.parse(body);

  assertNotSpam(
    {
      honeypot: input.website,
      formLoadedAt: input.formLoadedAt,
      message: input.message,
      name: input.name,
    },
    'enquiry',
  );

  // Optional: a guest enquiry is valid, so this must not throw when signed out.
  const user = await getCurrentUser().catch(() => null);

  const enquiry = await createEnquiry({
    type: input.type,
    name: input.name,
    email: input.email,
    phone: input.phone,
    packageId: input.packageId,
    destinationId: input.destinationId,
    serviceSlug: input.serviceSlug,
    travelDate: input.travelDate,
    travellers: input.travellers,
    budget: input.budget,
    message: input.message,
    serviceDetails: input.serviceDetails,
    userId: user ? String(user._id) : undefined,
    ip,
  });

  // Awaited so the platform cannot kill the request before dispatch, but the
  // enquiry is already committed — a failed send never fails the response.
  await notifyEnquiryCreated({
    referenceCode: enquiry.referenceCode,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    type: enquiry.type,
    packageTitle: enquiry.packageRef?.title,
    travelDate: enquiry.travelDate
      ? new Date(enquiry.travelDate).toLocaleDateString('en-IN')
      : undefined,
    travellers: `${enquiry.travellers.adults} adults, ${enquiry.travellers.children} children`,
    budget: enquiry.budget ? `INR ${enquiry.budget.toLocaleString('en-IN')}` : undefined,
    message: enquiry.message,
  }).catch(() => undefined);

  return apiSuccess(
    { enquiry: { referenceCode: enquiry.referenceCode, id: enquiry.id } },
    {
      status: 201,
      message:
        "Thank you — we've received your enquiry and will be in touch shortly.",
    },
  );
});

/** GET /api/enquiries — the signed-in customer's own enquiries. */
export const GET = route('GET /api/enquiries', async (request: NextRequest) => {
  const user = await requireUser();
  const { page, limit } = paginationSchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { enquiries, total } = await listUserEnquiries(String(user._id), page, limit);

  return apiSuccess(
    { enquiries },
    { meta: buildPaginationMeta(page, limit, total) },
  );
});
