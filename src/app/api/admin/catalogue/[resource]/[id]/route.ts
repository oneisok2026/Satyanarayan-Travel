import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin, requireSuperAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import {
  statusSchema,
  featuredSchema,
  packageWriteSchema,
  destinationWriteSchema,
  categoryWriteSchema,
  serviceWriteSchema,
  blogWriteSchema,
} from '@/lib/validation/catalogue-admin.schema';
import {
  deleteCatalogueItem,
  getCatalogueItem,
  isCatalogueResource,
  labelFor,
  setCatalogueFeatured,
  setCatalogueStatus,
  updateCatalogueItem,
  type CatalogueResource,
} from '@/services/catalogue-admin.service';
import { recordAudit, type AuditAction } from '@/services/audit.service';
import { notFound, validationError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ resource: string; id: string }> };

/** Write schema per resource. Gallery has no full editor yet. */
const WRITE_SCHEMAS = {
  packages: packageWriteSchema,
  destinations: destinationWriteSchema,
  categories: categoryWriteSchema,
  services: serviceWriteSchema,
  blogs: blogWriteSchema,
} as const;

async function resolveParams(context: Context) {
  const { resource, id } = await context.params;
  if (!isCatalogueResource(resource)) throw notFound('Resource');
  return { resource, id: objectIdSchema.parse(id) };
}

/** GET — fetch one record for editing, including unpublished ones. */
export const GET = route<Context>(
  'GET /api/admin/catalogue/[resource]/[id]',
  async (_request, context) => {
    await requireAdmin();
    const { resource, id } = await resolveParams(context);
    const item = await getCatalogueItem(resource, id);
    return apiSuccess({ item });
  },
);

/**
 * PATCH — status toggle, featured toggle, or a full update.
 *
 * Status and featured are admin-level, since they only change visibility.
 * A full content edit requires super_admin.
 */
export const PATCH = route<Context>(
  'PATCH /api/admin/catalogue/[resource]/[id]',
  async (request: NextRequest, context) => {
    const { resource, id } = await resolveParams(context);
    const body = await readJsonBody(request);
    const ip = getClientIp(request);

    if (typeof body !== 'object' || body === null) {
      throw validationError('Invalid request body');
    }

    // --- status toggle ---------------------------------------------------
    if ('status' in body && Object.keys(body).length === 1) {
      const admin = await requireAdmin();
      const { status } = statusSchema.parse(body);
      const result = await setCatalogueStatus(resource, id, status);

      await recordAudit({
        actor: admin,
        action: `${resource}.status_changed` as AuditAction,
        entityType: labelFor(resource),
        entityId: id,
        changes: { status: { from: result.previous, to: status } },
        metadata: { title: result.title, slug: result.slug },
        ip,
      });

      return apiSuccess(
        { status },
        {
          message:
            status === 'published'
              ? `${labelFor(resource)} is now live on the website.`
              : `${labelFor(resource)} is hidden from the website.`,
        },
      );
    }

    // --- featured toggle -------------------------------------------------
    if ('featured' in body && Object.keys(body).length === 1) {
      const admin = await requireAdmin();
      const { featured } = featuredSchema.parse(body);
      const result = await setCatalogueFeatured(resource, id, featured);

      await recordAudit({
        actor: admin,
        action: `${resource}.updated` as AuditAction,
        entityType: labelFor(resource),
        entityId: id,
        changes: { featured: { from: result.previous, to: featured } },
        metadata: { title: result.title },
        ip,
      });

      return apiSuccess(
        { featured },
        { message: featured ? 'Marked as featured.' : 'Removed from featured.' },
      );
    }

    // --- full update -----------------------------------------------------
    const admin = await requireSuperAdmin();

    const schema = WRITE_SCHEMAS[resource as keyof typeof WRITE_SCHEMAS];
    if (!schema) {
      throw validationError(`${labelFor(resource)} cannot be edited here yet`);
    }

    const input = schema.parse(body);
    const { before, after } = await updateCatalogueItem(
      resource,
      id,
      input as Record<string, unknown>,
    );

    await recordAudit({
      actor: admin,
      action: `${resource}.updated` as AuditAction,
      entityType: labelFor(resource),
      entityId: id,
      changes: diffFields(before, after as Record<string, unknown>),
      ip,
    });

    return apiSuccess(
      { item: after },
      { message: `${labelFor(resource)} updated.` },
    );
  },
);

/** DELETE — super_admin only, refused when live data references the record. */
export const DELETE = route<Context>(
  'DELETE /api/admin/catalogue/[resource]/[id]',
  async (request: NextRequest, context) => {
    const admin = await requireSuperAdmin();
    const { resource, id } = await resolveParams(context);

    const removed = await deleteCatalogueItem(resource, id);

    await recordAudit({
      actor: admin,
      action: `${resource}.deleted` as AuditAction,
      entityType: labelFor(resource),
      entityId: id,
      metadata: { title: removed.title, slug: removed.slug },
      ip: getClientIp(request),
    });

    return apiSuccess(
      { deleted: true },
      { message: `${labelFor(resource)} deleted permanently.` },
    );
  },
);

/**
 * Field-level diff for the audit trail.
 *
 * Compares scalars only — arrays and nested objects are recorded as
 * "changed" rather than dumping whole itineraries into the log.
 */
function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const skip = new Set(['_id', '__v', 'createdAt', 'updatedAt']);

  for (const key of Object.keys(after)) {
    if (skip.has(key)) continue;

    const from = before[key];
    const to = after[key];

    const scalar =
      (from === null || typeof from !== 'object') &&
      (to === null || typeof to !== 'object');

    if (scalar) {
      if (from !== to) changes[key] = { from, to };
    } else if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[key] = { from: '(changed)', to: '(changed)' };
    }
  }

  return changes;
}

export type { CatalogueResource };
