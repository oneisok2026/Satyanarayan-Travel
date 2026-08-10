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
  | 'package.created'
  | 'package.updated'
  | 'package.deleted'
  | 'destination.created'
  | 'destination.updated'
  | 'destination.deleted'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted'
  | 'enquiry.status_changed'
  | 'enquiry.note_added'
  | 'enquiry.deleted'
  | 'booking.status_changed'
  | 'booking.payment_changed'
  | 'booking.cancelled'
  | 'review.moderated'
  | 'review.deleted'
  | 'blog.created'
  | 'blog.updated'
  | 'blog.deleted'
  | 'gallery.created'
  | 'gallery.updated'
  | 'gallery.deleted'
  | 'service.updated'
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
