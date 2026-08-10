import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { paginationSchema, searchParamsToObject } from '@/lib/validation/common.schema';
import { listCustomers } from '@/services/admin.service';
import { USER_ROLES, USER_STATUSES } from '@/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const GET = route('GET /api/admin/customers', async (request: NextRequest) => {
  await requireAdmin();

  const query = querySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { customers, total } = await listCustomers(query);

  return apiSuccess(
    { customers },
    { meta: buildPaginationMeta(query.page, query.limit, total) },
  );
});
