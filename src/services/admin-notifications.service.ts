import 'server-only';

import { connectToDatabase } from '@/lib/db/connect';
import { Enquiry } from '@/models/Enquiry';
import { Booking } from '@/models/Booking';
import { Review } from '@/models/Review';

/**
 * Admin notification feed.
 *
 * Derived from records that need attention rather than stored as its own
 * collection: an unanswered enquiry, an unconfirmed booking and an unmoderated
 * review are already represented by their status. Deriving them means the list
 * cannot drift out of sync with the records it describes, and acting on an
 * item clears it without a second write.
 *
 * The trade-off is that "read" state cannot be tracked per admin. That is
 * deliberate for now — the count reflects outstanding work, not unseen items.
 *
 * Distinct from notification.service.ts, which sends transactional email.
 */

export type NotificationKind = 'enquiry' | 'booking' | 'review';

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

  const [enquiries, bookings, reviews, enquiryCount, bookingCount, reviewCount] =
    await Promise.all([
      Enquiry.find({ status: 'new' })
        .select('name type createdAt')
        .sort({ createdAt: -1 })
        .limit(PER_KIND_LIMIT)
        .lean(),
      Booking.find({ status: { $in: ['requested', 'pending_confirmation'] } })
        .select('bookingReference contact createdAt')
        .sort({ createdAt: -1 })
        .limit(PER_KIND_LIMIT)
        .lean(),
      Review.find({ status: 'pending' })
        .select('authorName rating createdAt')
        .sort({ createdAt: -1 })
        .limit(PER_KIND_LIMIT)
        .lean(),
      Enquiry.countDocuments({ status: 'new' }),
      Booking.countDocuments({ status: { $in: ['requested', 'pending_confirmation'] } }),
      Review.countDocuments({ status: 'pending' }),
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
    ...reviews.map((doc) => ({
      id: `review-${doc._id}`,
      kind: 'review' as const,
      title: 'Review awaiting moderation',
      detail: `${doc.authorName} left ${doc.rating}★`,
      href: '/admin/reviews',
      createdAt: doc.createdAt.toISOString(),
    })),
  ];

  // Newest first across all three kinds, so the panel reads chronologically.
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    items: items.slice(0, limit),
    total: enquiryCount + bookingCount + reviewCount,
  };
}
