import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireSuperAdmin } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { SiteSetting } from '@/models/SiteSetting';
import { recordAudit } from '@/services/audit.service';
import {
  PRICE_ON_REQUEST_KEY,
  PRICE_ON_REQUEST_FALLBACK,
} from '@/services/contact.service';
import { notFound } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Settings an admin may write from the dashboard.
 *
 * A closed list rather than an arbitrary key, because `key` selects the
 * document to overwrite: accepting any string would let this endpoint rewrite
 * SEO overrides and company details through the same form.
 */
const EDITABLE_SETTINGS = {
  [PRICE_ON_REQUEST_KEY]: {
    group: 'packages',
    isPublic: true,
    label: 'Price enquiry message',
    /** Revalidated so the change appears without waiting out the cache. */
    paths: ['/', '/tours', '/tours/domestic', '/tours/international'],
    schema: z.string().trim().max(120),
  },
} as const;

type EditableKey = keyof typeof EDITABLE_SETTINGS;

function isEditableKey(value: string): value is EditableKey {
  return value in EDITABLE_SETTINGS;
}

const bodySchema = z.object({
  key: z.string().trim().min(1).max(120),
  /**
   * An empty string is a deliberate "reset to the default wording" rather than
   * a validation failure — it is how the delete action is expressed for a
   * setting that must always resolve to something.
   */
  value: z.string().max(120),
});

/**
 * PUT — write one site setting. super_admin only.
 *
 * Upserts rather than requiring the row to exist, so a setting that was never
 * seeded can still be given a value from the dashboard.
 */
export const PUT = route('PUT /api/admin/settings', async (request: NextRequest) => {
  const admin = await requireSuperAdmin();

  const body = bodySchema.parse(await readJsonBody(request));
  if (!isEditableKey(body.key)) throw notFound('Setting');

  const definition = EDITABLE_SETTINGS[body.key];
  const value = definition.schema.parse(body.value);

  await connectToDatabase();

  const previous = await SiteSetting.findOne({ key: body.key }).select('value').lean();

  await SiteSetting.updateOne(
    { key: body.key },
    {
      $set: {
        value,
        group: definition.group,
        isPublic: definition.isPublic,
        updatedBy: admin._id,
      },
    },
    { upsert: true },
  );

  for (const path of definition.paths) revalidatePath(path);
  // Package detail pages are cached per slug; the layout route covers them all.
  revalidatePath('/packages/[slug]', 'page');

  await recordAudit({
    actor: admin,
    action: 'settings.updated',
    entityType: 'Setting',
    entityId: body.key,
    changes: {
      value: { from: previous?.value ?? null, to: value },
    },
    metadata: { label: definition.label },
    ip: getClientIp(request),
  });

  return apiSuccess(
    { key: body.key, value: value || PRICE_ON_REQUEST_FALLBACK },
    {
      message: value
        ? 'Message updated.'
        : 'Message reset to the default wording.',
    },
  );
});
