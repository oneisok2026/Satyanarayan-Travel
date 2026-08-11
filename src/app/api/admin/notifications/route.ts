import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { getAdminNotifications } from '@/services/admin-notifications.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — outstanding work for the admin bell. */
export const GET = route('GET /api/admin/notifications', async () => {
  await requireAdmin();

  const feed = await getAdminNotifications();

  return apiSuccess(feed);
});
