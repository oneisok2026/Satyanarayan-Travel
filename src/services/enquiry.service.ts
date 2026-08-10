import 'server-only';

import { randomBytes } from 'node:crypto';
import type { FilterQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { Enquiry, type EnquiryAttributes } from '@/models/Enquiry';
import { TourPackage } from '@/models/TourPackage';
import { Destination } from '@/models/Destination';
import { notFound, validationError } from '@/lib/errors';
import { toObjectId } from '@/lib/security/sanitize';
import { hashIp } from './audit.service';
import { offsetFor } from '@/lib/validation/common.schema';
import { logger } from '@/lib/logger';
import type { EnquiryStatus, EnquiryType } from '@/constants';
import type { EnquiryDTO } from '@/types';
import { toEnquiryDTO } from './mappers';

export interface CreateEnquiryInput {
  type: EnquiryType;
  name: string;
  email: string;
  phone: string;
  packageId?: string;
  destinationId?: string;
  serviceSlug?: string;
  travelDate?: Date;
  travellers?: { adults: number; children: number };
  budget?: number;
  message?: string;
  serviceDetails?: Record<string, string | number | boolean>;
  /** Set from the verified session when signed in; never from the request body. */
  userId?: string;
  ip?: string;
  source?: string;
}

export async function createEnquiry(input: CreateEnquiryInput): Promise<EnquiryDTO> {
  await connectToDatabase();

  // Referenced entities must exist and be published, so an enquiry cannot be
  // attached to a draft or deleted package by guessing an id.
  if (input.packageId) {
    const exists = await TourPackage.exists({
      _id: toObjectId(input.packageId, 'packageId'),
      status: 'published',
    });
    if (!exists) throw notFound('Package');
  }

  if (input.destinationId) {
    const exists = await Destination.exists({
      _id: toObjectId(input.destinationId, 'destinationId'),
      status: 'published',
    });
    if (!exists) throw notFound('Destination');
  }

  const enquiry = await Enquiry.create({
    referenceCode: generateReference('ENQ'),
    type: input.type,
    userId: input.userId ? toObjectId(input.userId) : undefined,
    packageId: input.packageId ? toObjectId(input.packageId) : undefined,
    destinationId: input.destinationId ? toObjectId(input.destinationId) : undefined,
    serviceSlug: input.serviceSlug,
    name: input.name,
    email: input.email,
    phone: input.phone,
    travelDate: input.travelDate,
    travellers: input.travellers ?? { adults: 1, children: 0 },
    budget: input.budget,
    message: input.message,
    serviceDetails: input.serviceDetails,
    status: 'new',
    source: input.source ?? 'website',
    ipHash: input.ip ? hashIp(input.ip) : undefined,
  });

  logger.info('Enquiry created', {
    referenceCode: enquiry.referenceCode,
    type: enquiry.type,
  });

  return toEnquiryDTO(enquiry.toObject());
}

/** Enquiries belonging to one customer. Scoped by userId, never by email. */
export async function listUserEnquiries(
  userId: string,
  page: number,
  limit: number,
): Promise<{ enquiries: EnquiryDTO[]; total: number }> {
  await connectToDatabase();

  const query = { userId: toObjectId(userId) };

  const [documents, total] = await Promise.all([
    Enquiry.find(query)
      .populate('packageId', 'title slug')
      .populate('destinationId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(offsetFor(page, limit))
      .limit(limit)
      .lean(),
    Enquiry.countDocuments(query),
  ]);

  return { enquiries: documents.map(toEnquiryDTO), total };
}

export interface AdminEnquiryFilters {
  status?: EnquiryStatus;
  type?: EnquiryType;
  search?: string;
  page: number;
  limit: number;
}

export async function listEnquiriesForAdmin(
  filters: AdminEnquiryFilters,
): Promise<{ enquiries: EnquiryDTO[]; total: number }> {
  await connectToDatabase();

  const query: FilterQuery<EnquiryAttributes> = {};
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;

  if (filters.search) {
    const term = filters.search.trim().slice(0, 80);
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { referenceCode: regex },
    ];
  }

  const [documents, total] = await Promise.all([
    Enquiry.find(query)
      .populate('packageId', 'title slug')
      .populate('destinationId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(offsetFor(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    Enquiry.countDocuments(query),
  ]);

  return { enquiries: documents.map(toEnquiryDTO), total };
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: EnquiryStatus,
): Promise<{ previous: EnquiryStatus; enquiry: EnquiryDTO }> {
  await connectToDatabase();

  const enquiry = await Enquiry.findById(toObjectId(enquiryId));
  if (!enquiry) throw notFound('Enquiry');

  const previous = enquiry.status;
  enquiry.status = status;
  await enquiry.save();

  return { previous, enquiry: toEnquiryDTO(enquiry.toObject()) };
}

export async function addEnquiryNote(
  enquiryId: string,
  author: { id: string; name: string },
  note: string,
): Promise<EnquiryDTO> {
  await connectToDatabase();

  const trimmed = note.trim();
  if (!trimmed) throw validationError('Note cannot be empty', { note: ['Required'] });

  const enquiry = await Enquiry.findById(toObjectId(enquiryId));
  if (!enquiry) throw notFound('Enquiry');

  enquiry.internalNotes.push({
    authorId: toObjectId(author.id),
    authorName: author.name,
    note: trimmed,
    createdAt: new Date(),
  });
  await enquiry.save();

  return toEnquiryDTO(enquiry.toObject());
}

/** Admin view including internal notes, which the customer DTO omits. */
export async function getEnquiryForAdmin(enquiryId: string) {
  await connectToDatabase();

  const document = await Enquiry.findById(toObjectId(enquiryId))
    .populate('packageId', 'title slug')
    .populate('destinationId', 'name slug')
    .populate('userId', 'name email')
    .lean();

  if (!document) throw notFound('Enquiry');

  return {
    ...toEnquiryDTO(document),
    internalNotes: (document.internalNotes ?? []).map((note) => ({
      authorName: note.authorName,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
    })),
  };
}

/** Short, unambiguous reference (no confusable characters). */
function generateReference(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let suffix = '';
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `${prefix}-${suffix}`;
}

export { generateReference };
