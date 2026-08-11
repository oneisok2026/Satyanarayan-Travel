import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireSuperAdmin } from '@/lib/firebase/auth';
import { pageSeoSchema, parseSeoTarget } from '@/lib/validation/page-seo.schema';
import {
  savePageSeo,
  saveContentSeo,
  isSeoContentResource,
} from '@/services/page-seo.service';
import { recordAudit } from '@/services/audit.service';
import { notFound } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT — set the SEO for one page. super_admin only, matching the rest of the
 * admin write surface.
 *
 * Handles both kinds of target from a single endpoint, because the admin
 * screen presents them as one list: fixed routes store an override in
 * SiteSetting, catalogue entries store SEO on the record itself.
 *
 * Public pages are cached (several declare `revalidate`), so the affected path
 * is revalidated here. Without it an SEO change would not appear until the
 * cache window elapsed.
 */
export const PUT = route('PUT /api/admin/seo/pages', async (request: NextRequest) => {
  const admin = await requireSuperAdmin();

  const input = pageSeoSchema.parse(await readJsonBody(request));
  const { kind, id } = parseSeoTarget(input.target);

  const values = {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
  };

  let path: string;

  if (kind === 'page') {
    await savePageSeo(id, values, String(admin._id));
    path = id;
  } else {
    // The schema has already restricted `kind` to a known resource.
    if (!isSeoContentResource(kind)) throw notFound('Page');

    const result = await saveContentSeo(kind, id, values);
    if (!result) throw notFound('Page');
    path = result.path;
  }

  revalidatePath(path);

  await recordAudit({
    actor: admin,
    action: 'settings.updated',
    entityType: 'Page SEO',
    entityId: input.target,
    metadata: { path },
    ip: getClientIp(request),
  });

  return apiSuccess({ path }, { message: 'SEO updated.' });
});
