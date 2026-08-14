import 'server-only';

import { createHash } from 'node:crypto';
import { connectToDatabase } from '@/lib/db/connect';
import { AuditLog } from '@/models/AuditLog';
import type { UserDocument } from '@/models/User';
import { logger } from '@/lib/logger';

/** Actions worth recording. Kept as a union so typos fail the build. */
export type AuditAction =
  | 'user.role_changed'
  | 'user.status_changed'
  | 'user.claim_mismatch'
  // Catalogue actions are derived from the resource segment of the admin
  // route, so the plural form matches the URL: packages.updated, etc.
  | 'packages.created'
  | 'packages.updated'
  | 'packages.deleted'
  | 'packages.status_changed'
  | 'destinations.created'
  | 'destinations.updated'
  | 'destinations.deleted'
  | 'destinations.status_changed'
  | 'categories.created'
  | 'categories.updated'
  | 'categories.deleted'
  | 'categories.status_changed'
  | 'services.created'
  | 'services.updated'
  | 'services.deleted'
  | 'services.status_changed'
  | 'blogs.created'
  | 'blogs.updated'
  | 'blogs.deleted'
  | 'blogs.status_changed'
  | 'gallery.created'
  | 'gallery.updated'
  | 'gallery.deleted'
  | 'gallery.status_changed'
  | 'hero-slides.created'
  | 'hero-slides.updated'
  | 'hero-slides.deleted'
  | 'hero-slides.status_changed'
  | 'social-links.created'
  | 'social-links.updated'
  | 'social-links.deleted'
  | 'social-links.status_changed'
  | 'contact-details.created'
  | 'contact-details.updated'
  | 'contact-details.deleted'
  | 'contact-details.status_changed'
  | 'enquiry.status_changed'
  | 'enquiry.note_added'
  | 'enquiry.deleted'
  /** Bulk "mark as read" from the notification bell. */
  | 'enquiry.bulk_read'
  | 'booking.status_changed'
  | 'booking.payment_changed'
  | 'booking.cancelled'
  | 'booking.deleted'
  | 'settings.updated';

interface AuditInput {
  actor: Pick<UserDocument, '_id' | 'email' | 'role'>;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/**
 * Records a privileged action.
 *
 * Never throws: an audit write failing must not roll back the operation the
 * user actually asked for. Failures are logged at error level instead.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      actorId: input.actor._id,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes,
      metadata: input.metadata,
      ipHash: input.ip ? hashIp(input.ip) : undefined,
    });
  } catch (error) {
    logger.error('Audit log write failed', {
      action: input.action,
      entityType: input.entityType,
      error: error instanceof Error ? error : String(error),
    });
  }
}

/** IPs are stored hashed — enough to correlate abuse, not to track a person. */
function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export { hashIp };
