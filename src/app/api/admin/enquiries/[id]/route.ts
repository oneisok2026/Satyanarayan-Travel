import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin, requireSuperAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import {
  addEnquiryNoteSchema,
  updateEnquiryStatusSchema,
} from '@/lib/validation/enquiry.schema';
import {
  addEnquiryNote,
  deleteEnquiry,
  getEnquiryForAdmin,
  markEnquiryRead,
  updateEnquiryStatus,
} from '@/services/enquiry.service';
import { recordAudit } from '@/services/audit.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(
  'GET /api/admin/enquiries/[id]',
  async (_request, { params }) => {
    await requireAdmin();
    const { id } = await params;
    const enquiry = await getEnquiryForAdmin(objectIdSchema.parse(id));
    return apiSuccess({ enquiry });
  },
);

/** PATCH — status change or note, both audited. */
export const PATCH = route<Context>(
  'PATCH /api/admin/enquiries/[id]',
  async (request: NextRequest, { params }) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const enquiryId = objectIdSchema.parse(id);
    const body = await readJsonBody(request);

    // Marking as read is not audited: it records that a page was opened, not
    // a decision, and would bury real actions in noise.
    if (typeof body === 'object' && body !== null && 'read' in body) {
      const { unread } = await markEnquiryRead(enquiryId);
      return apiSuccess({ unread }, { message: 'Marked as read' });
    }

    if (typeof body === 'object' && body !== null && 'note' in body) {
      const { note } = addEnquiryNoteSchema.parse(body);
      const enquiry = await addEnquiryNote(
        enquiryId,
        { id: String(admin._id), name: admin.name },
        note,
      );

      await recordAudit({
        actor: admin,
        action: 'enquiry.note_added',
        entityType: 'Enquiry',
        entityId: enquiryId,
        ip: getClientIp(request),
      });

      return apiSuccess({ enquiry }, { message: 'Note added' });
    }

    const { status } = updateEnquiryStatusSchema.parse(body);
    const { previous, enquiry } = await updateEnquiryStatus(enquiryId, status);

    await recordAudit({
      actor: admin,
      action: 'enquiry.status_changed',
      entityType: 'Enquiry',
      entityId: enquiryId,
      changes: { status: { from: previous, to: status } },
      ip: getClientIp(request),
    });

    return apiSuccess({ enquiry }, { message: 'Enquiry updated' });
  },
);

/**
 * DELETE — super_admin only.
 *
 * A plain admin can move an enquiry through its statuses but cannot destroy
 * the record, matching how the catalogue restricts deletion. The audit entry
 * keeps the reference and customer details after the enquiry itself is gone.
 */
export const DELETE = route<Context>(
  'DELETE /api/admin/enquiries/[id]',
  async (request: NextRequest, { params }) => {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const enquiryId = objectIdSchema.parse(id);

    const removed = await deleteEnquiry(enquiryId);

    await recordAudit({
      actor: admin,
      action: 'enquiry.deleted',
      entityType: 'Enquiry',
      entityId: enquiryId,
      metadata: {
        referenceCode: removed.referenceCode,
        name: removed.name,
        email: removed.email,
      },
      ip: getClientIp(request),
    });

    return apiSuccess(
      { deleted: true },
      { message: `Enquiry ${removed.referenceCode} deleted permanently.` },
    );
  },
);
