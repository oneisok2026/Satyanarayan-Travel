import { route } from '@/lib/api-handler';
import { apiSuccess, cachePresets } from '@/lib/api-response';
import { listPublishedServices } from '@/services/content.service';

export const runtime = 'nodejs';

export const GET = route('GET /api/services', async () => {
  const services = await listPublishedServices();
  return apiSuccess({ services }, { cacheControl: cachePresets.publicLong });
});
