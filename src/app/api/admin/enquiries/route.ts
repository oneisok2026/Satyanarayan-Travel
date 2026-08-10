import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { enquiryListQuerySchema } from '@/lib/validation/enquiry.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { listEnquiriesForAdmin } from '@/services/enquiry.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/enquiries — admin inbox. */
export const GET = route('GET /api/admin/enquiries', async (request: NextRequest) => {
  // Re-verified here regardless of what the UI rendered.
  await requireAdmin();

  const query = enquiryListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { enquiries, total } = await listEnquiriesForAdmin(query);

  return apiSuccess(
    { enquiries },
    { meta: buildPaginationMeta(query.page, query.limit, total) },
  );
});
