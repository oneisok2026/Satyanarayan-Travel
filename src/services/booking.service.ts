import 'server-only';

import type { FilterQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { Booking, type BookingAttributes } from '@/models/Booking';
import { TourPackage } from '@/models/TourPackage';
import { conflict, notFound, validationError } from '@/lib/errors';
import { toObjectId } from '@/lib/security/sanitize';
import { offsetFor } from '@/lib/validation/common.schema';
import { generateReference } from './enquiry.service';
import { logger } from '@/lib/logger';
import type { BookingStatus, PaymentStatus } from '@/constants';
import type { BookingDTO } from '@/types';
import { toBookingDTO } from './mappers';

/**
 * Bookings.
 *
 * Pricing is always computed on the server from the stored package price.
 * Nothing the client sends about money is read (PRD §14: "Never trust
 * browser-generated totals").
 */

export interface CreateBookingInput {
  /** Absent for a guest booking made without signing in. */
  userId?: string;
  packageId: string;
  travelDate: Date;
  travellers: { name: string; age: number; gender?: 'male' | 'female' | 'other' }[];
  contact: { name: string; email: string; phone: string };
  notes?: string;
  idempotencyKey?: string;
}

/** Children priced separately; under-2 travel free, per usual agency practice. */
const CHILD_AGE_LIMIT = 12;
const INFANT_AGE_LIMIT = 2;

export async function createBooking(input: CreateBookingInput): Promise<BookingDTO> {
  await connectToDatabase();

  if (input.travellers.length === 0) {
    throw validationError('At least one traveller is required', {
      travellers: ['Add at least one traveller'],
    });
  }

  if (input.travelDate.getTime() < Date.now()) {
    throw validationError('Travel date must be in the future', {
      travelDate: ['Choose a future date'],
    });
  }

  // A retried submission returns the original booking rather than duplicating.
  // Guest bookings have no userId to scope by, so the key alone identifies
  // them — it is client-generated and random, so a collision across visitors
  // is not a practical concern.
  const idempotencyFilter = input.idempotencyKey
    ? {
        ...(input.userId ? { userId: toObjectId(input.userId) } : { userId: { $exists: false } }),
        idempotencyKey: input.idempotencyKey,
      }
    : null;

  if (idempotencyFilter) {
    const existing = await Booking.findOne(idempotencyFilter).lean();

    if (existing) {
      logger.info('Idempotent booking replay', {
        bookingReference: existing.bookingReference,
      });
      return toBookingDTO(existing);
    }
  }

  const pkg = await TourPackage.findById(toObjectId(input.packageId, 'packageId'))
    .select('title slug price childPrice status')
    .lean();

  if (!pkg || pkg.status !== 'published') throw notFound('Package');

  const pricing = calculatePricing({
    unitPrice: pkg.price,
    childPrice: pkg.childPrice ?? Math.round(pkg.price * 0.7),
    travellers: input.travellers,
  });

  try {
    const booking = await Booking.create({
      bookingReference: generateReference('STB'),
      ...(input.userId ? { userId: toObjectId(input.userId) } : {}),
      packageId: pkg._id,
      packageTitle: pkg.title,
      packageSlug: pkg.slug,
      travelDate: input.travelDate,
      travellers: input.travellers,
      pricingSnapshot: pricing,
      status: 'requested',
      paymentStatus: 'unpaid',
      contact: input.contact,
      notes: input.notes,
      idempotencyKey: input.idempotencyKey,
    });

    logger.info('Booking created', {
      bookingReference: booking.bookingReference,
      total: pricing.total,
    });

    return toBookingDTO(booking.toObject());
  } catch (error) {
    // Lost the race against a concurrent identical submission — return theirs.
    if (isDuplicateKey(error) && idempotencyFilter) {
      const existing = await Booking.findOne(idempotencyFilter).lean();
      if (existing) return toBookingDTO(existing);
    }
    throw error;
  }
}

/**
 * Authoritative price calculation. Exported so tests can assert the maths
 * independently of the database.
 */
export function calculatePricing(input: {
  unitPrice: number;
  childPrice: number;
  travellers: { age: number }[];
}) {
  let adults = 0;
  let children = 0;

  for (const traveller of input.travellers) {
    if (traveller.age < INFANT_AGE_LIMIT) continue; // infants free
    if (traveller.age < CHILD_AGE_LIMIT) children += 1;
    else adults += 1;
  }

  // A party of only infants still pays one adult fare.
  if (adults === 0 && children === 0) adults = 1;

  const subtotal = adults * input.unitPrice + children * input.childPrice;

  return {
    unitPrice: input.unitPrice,
    childPrice: input.childPrice,
    adults,
    children,
    subtotal,
    // Package prices are quoted inclusive, so nothing is added on top: the
    // total must match the figure shown on the package page.
    taxes: 0,
    discount: 0,
    total: subtotal,
    currency: 'INR',
  };
}

export async function listUserBookings(
  userId: string,
  page: number,
  limit: number,
): Promise<{ bookings: BookingDTO[]; total: number }> {
  await connectToDatabase();

  const query = { userId: toObjectId(userId) };

  const [documents, total] = await Promise.all([
    Booking.find(query)
      .populate('packageId', 'title slug coverImage')
      .sort({ createdAt: -1 })
      .skip(offsetFor(page, limit))
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
  ]);

  return { bookings: documents.map(toBookingDTO), total };
}

/**
 * Fetches one booking, scoped to its owner unless the caller is an admin.
 * The ownership filter is part of the query, so a wrong id yields 404 rather
 * than leaking that someone else's booking exists.
 */
export async function getBooking(
  bookingId: string,
  requester: { userId: string; isAdmin: boolean },
): Promise<BookingDTO> {
  await connectToDatabase();

  const query: FilterQuery<BookingAttributes> = { _id: toObjectId(bookingId) };
  if (!requester.isAdmin) query.userId = toObjectId(requester.userId);

  const document = await Booking.findOne(query)
    .populate('packageId', 'title slug coverImage')
    .lean();

  if (!document) throw notFound('Booking');
  return toBookingDTO(document);
}

export interface AdminBookingFilters {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page: number;
  limit: number;
}

export async function listBookingsForAdmin(
  filters: AdminBookingFilters,
): Promise<{ bookings: BookingDTO[]; total: number }> {
  await connectToDatabase();

  const query: FilterQuery<BookingAttributes> = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;

  if (filters.search) {
    const term = filters.search.trim().slice(0, 80);
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { bookingReference: regex },
      { 'contact.name': regex },
      { 'contact.email': regex },
      { packageTitle: regex },
    ];
  }

  const [documents, total] = await Promise.all([
    Booking.find(query)
      .populate('packageId', 'title slug coverImage')
      .sort({ createdAt: -1 })
      .skip(offsetFor(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    Booking.countDocuments(query),
  ]);

  return { bookings: documents.map(toBookingDTO), total };
}

/** Terminal states cannot be reopened; guards against accidental reversal. */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['pending_confirmation', 'confirmed', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<{ previous: BookingStatus; booking: BookingDTO }> {
  await connectToDatabase();

  const booking = await Booking.findById(toObjectId(bookingId));
  if (!booking) throw notFound('Booking');

  const previous = booking.status;

  if (previous !== status && !ALLOWED_TRANSITIONS[previous].includes(status)) {
    throw conflict(
      `A ${previous.replace('_', ' ')} booking cannot be changed to ${status.replace('_', ' ')}`,
    );
  }

  booking.status = status;
  await booking.save();

  return { previous, booking: toBookingDTO(booking.toObject()) };
}

export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: PaymentStatus,
): Promise<{ previous: PaymentStatus; booking: BookingDTO }> {
  await connectToDatabase();

  const booking = await Booking.findById(toObjectId(bookingId));
  if (!booking) throw notFound('Booking');

  const previous = booking.paymentStatus;
  booking.paymentStatus = paymentStatus;
  await booking.save();

  return { previous, booking: toBookingDTO(booking.toObject()) };
}

/**
 * Permanently removes a booking.
 *
 * Distinct from cancelling: cancellation keeps the record and its history,
 * which is what the agency normally wants. This is for clearing test entries
 * and spam, so it is restricted to a super admin and audited — the identifying
 * fields are returned because the record itself will not survive the write.
 */
export async function deleteBooking(
  bookingId: string,
): Promise<{ bookingReference: string; customerName: string; packageTitle: string }> {
  await connectToDatabase();

  const removed = await Booking.findByIdAndDelete(toObjectId(bookingId)).lean();
  if (!removed) throw notFound('Booking');

  return {
    bookingReference: removed.bookingReference,
    customerName: removed.contact.name,
    packageTitle: removed.packageTitle,
  };
}

/** Customer-initiated cancellation, only before confirmation. */
export async function cancelOwnBooking(
  bookingId: string,
  userId: string,
): Promise<BookingDTO> {
  await connectToDatabase();

  const booking = await Booking.findOne({
    _id: toObjectId(bookingId),
    userId: toObjectId(userId),
  });

  if (!booking) throw notFound('Booking');

  if (booking.status === 'cancelled') {
    return toBookingDTO(booking.toObject());
  }

  if (!ALLOWED_TRANSITIONS[booking.status].includes('cancelled')) {
    throw conflict(
      'This booking can no longer be cancelled online. Please contact us directly.',
    );
  }

  booking.status = 'cancelled';
  await booking.save();

  return toBookingDTO(booking.toObject());
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  );
}
