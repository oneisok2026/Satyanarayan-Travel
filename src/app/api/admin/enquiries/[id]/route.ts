import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import {
  addEnquiryNoteSchema,
  updateEnquiryStatusSchema,
} from '@/lib/validation/enquiry.schema';
import {
  addEnquiryNote,
  getEnquiryForAdmin,
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
