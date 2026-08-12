import 'server-only';

import { connectToDatabase } from '@/lib/db/connect';
import { Enquiry } from '@/models/Enquiry';
import { Booking } from '@/models/Booking';

/**
 * Admin notification feed.
 *
 * Derived from records that need attention rather than stored as its own
 * collection: an unanswered enquiry and an unconfirmed booking are already
 * represented by their status. Deriving them means the list cannot drift out
 * of sync with the records it describes, and acting on an item clears it
 * without a second write.
 *
 * The trade-off is that "read" state cannot be tracked per admin. That is
 * deliberate for now — the count reflects outstanding work, not unseen items.
 *
 * Distinct from notification.service.ts, which sends transactional email.
 */

export type NotificationKind = 'enquiry' | 'booking';

export interface AdminNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

export interface NotificationFeed {
  items: AdminNotification[];
  /** Total outstanding, which may exceed the number of items returned. */
  total: number;
}

const PER_KIND_LIMIT = 8;

export async function getAdminNotifications(limit = 12): Promise<NotificationFeed> {
  await connectToDatabase();

  // Unread rather than status:'new' — an admin who has read an enquiry but
  // not yet phoned the customer should not keep being told about it, and
  // marking it "contacted" just to clear the badge would misreport the work.
  const unread = { readAt: { $exists: false } };

  const [enquiries, bookings, enquiryCount, bookingCount] = await Promise.all([
    Enquiry.find(unread)
      .select('name type createdAt')
      .sort({ createdAt: -1 })
      .limit(PER_KIND_LIMIT)
      .lean(),
    Booking.find({ status: { $in: ['requested', 'pending_confirmation'] } })
      .select('bookingReference contact createdAt')
      .sort({ createdAt: -1 })
      .limit(PER_KIND_LIMIT)
      .lean(),
    Enquiry.countDocuments(unread),
    Booking.countDocuments({ status: { $in: ['requested', 'pending_confirmation'] } }),
  ]);

  const items: AdminNotification[] = [
    ...enquiries.map((doc) => ({
      id: `enquiry-${doc._id}`,
      kind: 'enquiry' as const,
      title: 'New enquiry',
      detail: `${doc.name} — ${doc.type.replace(/_/g, ' ')}`,
      href: '/admin/enquiries',
      createdAt: doc.createdAt.toISOString(),
    })),
    ...bookings.map((doc) => ({
      id: `booking-${doc._id}`,
      kind: 'booking' as const,
      title: 'Booking awaiting confirmation',
      detail: `${doc.bookingReference} — ${doc.contact.name}`,
      href: '/admin/bookings',
      createdAt: doc.createdAt.toISOString(),
    })),
  ];

  // Newest first across both kinds, so the panel reads chronologically.
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    items: items.slice(0, limit),
    total: enquiryCount + bookingCount,
  };
}
