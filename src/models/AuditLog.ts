import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { baseToJSON } from './shared';

/**
 * Append-only record of privileged actions.
 *
 * Written for role changes, status changes, deletions and moderation so a
 * privilege escalation can be traced after the fact.
 */
export interface AuditLogAttributes {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  /** Field-level before/after. Never store secrets or full documents here. */
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipHash?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogAttributes>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String, required: true, trim: true, maxlength: 254 },
    actorRole: { type: String, required: true, trim: true, maxlength: 40 },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    entityType: { type: String, required: true, trim: true, maxlength: 60 },
    entityId: { type: String, trim: true, maxlength: 64 },
    changes: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    ipHash: { type: String, maxlength: 64, select: false },
  },
  {
    // createdAt only: an audit entry is never updated.
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: baseToJSON,
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export type AuditLogDocument = HydratedDocument<AuditLogAttributes>;

export const AuditLog: Model<AuditLogAttributes> =
  (models.AuditLog as Model<AuditLogAttributes>) ??
  model<AuditLogAttributes>('AuditLog', auditLogSchema);
