import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireSuperAdmin } from '@/lib/firebase/auth';
import {
  packageWriteSchema,
  destinationWriteSchema,
  categoryWriteSchema,
  serviceWriteSchema,
  blogWriteSchema,
  galleryWriteSchema,
  heroSlideWriteSchema,
} from '@/lib/validation/catalogue-admin.schema';
import {
  createCatalogueItem,
  isCatalogueResource,
  labelFor,
} from '@/services/catalogue-admin.service';
import { recordAudit, type AuditAction } from '@/services/audit.service';
import { notFound, validationError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ resource: string }> };

const WRITE_SCHEMAS = {
  packages: packageWriteSchema,
  destinations: destinationWriteSchema,
  categories: categoryWriteSchema,
  services: serviceWriteSchema,
  blogs: blogWriteSchema,
  gallery: galleryWriteSchema,
  'hero-slides': heroSlideWriteSchema,
} as const;

/** POST — create a catalogue entry. super_admin only. */
export const POST = route<Context>(
  'POST /api/admin/catalogue/[resource]',
  async (request: NextRequest, context) => {
    const admin = await requireSuperAdmin();

    const { resource } = await context.params;
    if (!isCatalogueResource(resource)) throw notFound('Resource');

    const schema = WRITE_SCHEMAS[resource as keyof typeof WRITE_SCHEMAS];
    if (!schema) {
      throw validationError(`${labelFor(resource)} cannot be created here yet`);
    }

    const input = schema.parse(await readJsonBody(request));
    const created = await createCatalogueItem(
      resource,
      input as Record<string, unknown>,
    );

    await recordAudit({
      actor: admin,
      action: `${resource}.created` as AuditAction,
      entityType: labelFor(resource),
      entityId: String(created._id),
      metadata: { slug: created.slug },
      ip: getClientIp(request),
    });

    return apiSuccess(
      { item: created },
      { status: 201, message: `${labelFor(resource)} created.` },
    );
  },
);
