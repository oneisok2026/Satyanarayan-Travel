import type { NextRequest } from 'next/server';
import { route, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import {
  getAdminNotifications,
  markAllNotificationsRead,
} from '@/services/admin-notifications.service';
import { recordAudit } from '@/services/audit.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — outstanding work for the admin bell. */
export const GET = route('GET /api/admin/notifications', async () => {
  await requireAdmin();

  const feed = await getAdminNotifications();

  return apiSuccess(feed);
});

/**
 * POST — mark every unread enquiry as read, clearing the bell.
 *
 * Admin rather than super_admin: this dismisses a notification, it does not
 * change any record a customer can see. Bookings are untouched — see
 * markAllNotificationsRead.
 */
export const POST = route(
  'POST /api/admin/notifications',
  async (request: NextRequest) => {
    const admin = await requireAdmin();

    const { cleared, remaining } = await markAllNotificationsRead();

    // Worth an audit entry: it marks other people's queue as seen, so it should
    // be attributable.
    if (cleared > 0) {
      await recordAudit({
        actor: admin,
        action: 'enquiry.bulk_read',
        entityType: 'Enquiry',
        entityId: 'bulk',
        metadata: { markedRead: cleared },
        ip: getClientIp(request),
      });
    }

    const feed = await getAdminNotifications();

    return apiSuccess(
      { ...feed, cleared, remaining },
      {
        message:
          remaining > 0
            ? `Cleared ${cleared}. ${remaining} ${remaining === 1 ? 'booking' : 'bookings'} still awaiting confirmation.`
            : cleared > 0
              ? `Cleared ${cleared} ${cleared === 1 ? 'notification' : 'notifications'}.`
              : 'Nothing to clear.',
      },
    );
  },
);
