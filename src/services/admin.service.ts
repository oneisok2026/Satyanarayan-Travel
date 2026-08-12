import 'server-only';

import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { TourPackage } from '@/models/TourPackage';
import { Enquiry } from '@/models/Enquiry';
import { Booking } from '@/models/Booking';
import { buildSearchRegex, toObjectId } from '@/lib/security/sanitize';
import { offsetFor } from '@/lib/validation/common.schema';
import { notFound } from '@/lib/errors';
import type { ActivityItemDTO, AdminStatsDTO } from '@/types';
import type { UserRole, UserStatus } from '@/constants';

/** Dashboard counters. One round trip via Promise.all rather than sequential. */
export async function getDashboardStats(): Promise<AdminStatsDTO> {
  await connectToDatabase();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    customersTotal,
    customersNew,
    packagesTotal,
    packagesPublished,
    packagesFeatured,
    enquiriesTotal,
    enquiriesPending,
    enquiriesMonth,
    bookingsTotal,
    bookingsPending,
    bookingsConfirmed,
    bookingsMonth,
    revenue,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startOfMonth } }),
    TourPackage.countDocuments({}),
    TourPackage.countDocuments({ status: 'published' }),
    TourPackage.countDocuments({ status: 'published', featured: true }),
    Enquiry.countDocuments({}),
    Enquiry.countDocuments({ status: { $in: ['new', 'contacted', 'follow_up'] } }),
    Enquiry.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: { $in: ['requested', 'pending_confirmation'] } }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    // Only confirmed/completed bookings count toward revenue.
    Booking.aggregate<{ total: number }>([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$pricingSnapshot.total' } } },
    ]),
  ]);

  return {
    customers: { total: customersTotal, newThisMonth: customersNew },
    packages: {
      total: packagesTotal,
      published: packagesPublished,
      featured: packagesFeatured,
    },
    enquiries: {
      total: enquiriesTotal,
      pending: enquiriesPending,
      thisMonth: enquiriesMonth,
    },
    bookings: {
      total: bookingsTotal,
      pending: bookingsPending,
      confirmed: bookingsConfirmed,
      thisMonth: bookingsMonth,
    },
    revenue: { confirmedTotal: revenue[0]?.total ?? 0, currency: 'INR' },
  };
}

/** Recent cross-entity activity for the dashboard feed. */
export async function getRecentActivity(limit = 10): Promise<ActivityItemDTO[]> {
  await connectToDatabase();

  const [enquiries, bookings] = await Promise.all([
    Enquiry.find({})
      .select('referenceCode name status createdAt type')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Booking.find({})
      .select('bookingReference contact status createdAt packageTitle')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  const items: ActivityItemDTO[] = [
    ...enquiries.map((entry) => ({
      id: String(entry._id),
      type: 'enquiry' as const,
      title: `${entry.name} sent an enquiry`,
      subtitle: entry.referenceCode,
      status: entry.status,
      href: `/admin/enquiries/${entry._id}`,
      createdAt: entry.createdAt.toISOString(),
    })),
    ...bookings.map((entry) => ({
      id: String(entry._id),
      type: 'booking' as const,
      title: `${entry.contact.name} booked ${entry.packageTitle}`,
      subtitle: entry.bookingReference,
      status: entry.status,
      href: `/admin/bookings/${entry._id}`,
      createdAt: entry.createdAt.toISOString(),
    })),
  ];

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export interface CustomerListFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page: number;
  limit: number;
}

export async function listCustomers(filters: CustomerListFilters) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;

  if (filters.search) {
    const regex = buildSearchRegex(filters.search);
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const [documents, total] = await Promise.all([
    User.find(query)
      // passportNumber is select:false, so it cannot appear in an admin list.
      .select('firebaseUid email name phone photoURL role status createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .skip(offsetFor(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    customers: documents.map((document) => ({
      id: String(document._id),
      firebaseUid: document.firebaseUid,
      email: document.email,
      name: document.name,
      phone: document.phone,
      photoURL: document.photoURL,
      role: document.role,
      status: document.status,
      createdAt: document.createdAt.toISOString(),
      lastLoginAt: document.lastLoginAt?.toISOString(),
    })),
    total,
  };
}

/**
 * Changes account status. Suspending revokes every Firebase session so the
 * user is signed out everywhere immediately rather than at cookie expiry.
 */
export async function setUserStatus(
  userId: string,
  status: UserStatus,
): Promise<{ previous: UserStatus; firebaseUid: string }> {
  await connectToDatabase();

  const user = await User.findById(toObjectId(userId));
  if (!user) throw notFound('User');

  const previous = user.status;
  user.status = status;
  await user.save();

  if (status !== 'active') {
    const { revokeUserSessions } = await import('@/lib/firebase/session');
    await revokeUserSessions(user.firebaseUid).catch(() => undefined);
  }

  return { previous, firebaseUid: user.firebaseUid };
}
