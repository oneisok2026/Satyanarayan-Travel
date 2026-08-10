import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin, requireSuperAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { setUserStatus } from '@/services/admin.service';
import { setUserRole } from '@/services/user.service';
import { recordAudit } from '@/services/audit.service';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { toObjectId } from '@/lib/security/sanitize';
import { forbidden, notFound, validationError } from '@/lib/errors';
import { USER_ROLES, USER_STATUSES } from '@/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
  })
  .refine((value) => value.role != null || value.status != null, {
    message: 'Provide a role or status to update',
  });

export const GET = route<Context>(
  'GET /api/admin/customers/[id]',
  async (_request, { params }) => {
    await requireAdmin();
    const { id } = await params;

    await connectToDatabase();
    const user = await User.findById(toObjectId(objectIdSchema.parse(id)))
      .select('firebaseUid email name phone photoURL role status profile createdAt lastLoginAt')
      .lean();

    if (!user) throw notFound('User');

    return apiSuccess({
      customer: {
        id: String(user._id),
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        photoURL: user.photoURL,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
      },
    });
  },
);

/**
 * PATCH — role and status changes.
 *
 * Role changes require super_admin: an admin must not be able to promote
 * themselves or a peer. Both operations are audited, and self-targeting is
 * blocked so the last super_admin cannot lock themselves out.
 */
export const PATCH = route<Context>(
  'PATCH /api/admin/customers/[id]',
  async (request: NextRequest, { params }) => {
    const { id } = await params;
    const targetId = objectIdSchema.parse(id);
    const input = patchSchema.parse(await readJsonBody(request));
    const ip = getClientIp(request);

    if (input.role) {
      const actor = await requireSuperAdmin();

      if (String(actor._id) === targetId) {
        throw forbidden('You cannot change your own role.');
      }

      await connectToDatabase();
      const target = await User.findById(toObjectId(targetId)).select('firebaseUid role').lean();
      if (!target) throw notFound('User');

      // Never leave the system without a super_admin.
      if (target.role === 'super_admin' && input.role !== 'super_admin') {
        const remaining = await User.countDocuments({
          role: 'super_admin',
          status: 'active',
        });
        if (remaining <= 1) {
          throw validationError('At least one active super admin must remain', {
            role: ['Cannot demote the last super admin'],
          });
        }
      }

      const updated = await setUserRole(target.firebaseUid, input.role);

      await recordAudit({
        actor,
        action: 'user.role_changed',
        entityType: 'User',
        entityId: targetId,
        changes: { role: { from: target.role, to: input.role } },
        ip,
      });

      return apiSuccess(
        { customer: { id: targetId, role: updated.role } },
        { message: 'Role updated' },
      );
    }

    // Status changes are available to any admin.
    const actor = await requireAdmin();

    if (String(actor._id) === targetId) {
      throw forbidden('You cannot change your own account status.');
    }

    const { previous, firebaseUid } = await setUserStatus(targetId, input.status!);

    await recordAudit({
      actor,
      action: 'user.status_changed',
      entityType: 'User',
      entityId: targetId,
      changes: { status: { from: previous, to: input.status! } },
      metadata: { firebaseUid, sessionsRevoked: input.status !== 'active' },
      ip,
    });

    return apiSuccess(
      { customer: { id: targetId, status: input.status } },
      { message: 'Account status updated' },
    );
  },
);
