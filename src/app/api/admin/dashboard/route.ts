import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { getDashboardStats, getRecentActivity } from '@/services/admin.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route('GET /api/admin/dashboard', async () => {
  await requireAdmin();

  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(10),
  ]);

  return apiSuccess({ stats, activity });
});
