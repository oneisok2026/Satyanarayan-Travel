import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { bookingListQuerySchema } from '@/lib/validation/booking.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { listBookingsForAdmin } from '@/services/booking.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route('GET /api/admin/bookings', async (request: NextRequest) => {
  await requireAdmin();

  const query = bookingListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { bookings, total } = await listBookingsForAdmin(query);

  return apiSuccess(
    { bookings },
    { meta: buildPaginationMeta(query.page, query.limit, total) },
  );
});
