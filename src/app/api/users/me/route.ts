import type { NextRequest } from 'next/server';
import { route, readJsonBody } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireUser } from '@/lib/firebase/auth';
import { updateProfileSchema } from '@/lib/validation/auth.schema';
import { toSessionUser, toUserProfile } from '@/services/user.service';
import { connectToDatabase } from '@/lib/db/connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/users/me — the signed-in user's own profile. */
export const GET = route('GET /api/users/me', async () => {
  const user = await requireUser();
  return apiSuccess({
    user: toSessionUser(user),
    profile: toUserProfile(user),
  });
});

/**
 * PATCH /api/users/me — update own profile.
 *
 * The identity comes from the session cookie, never the body, so a request
 * cannot target another account. The schema is `.strict()` and omits role and
 * status, so those fields are rejected outright rather than silently ignored.
 */
export const PATCH = route('PATCH /api/users/me', async (request: NextRequest) => {
  const user = await requireUser();
  const body = await readJsonBody(request);
  const input = updateProfileSchema.parse(body);

  await connectToDatabase();

  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone || undefined;

  if (input.profile) {
    user.profile = {
      ...user.profile,
      ...Object.fromEntries(
        Object.entries(input.profile).filter(([, value]) => value !== ''),
      ),
    };
  }

  if (input.preferences) {
    user.preferences = { ...user.preferences, ...input.preferences };
  }

  await user.save();

  return apiSuccess(
    { user: toSessionUser(user), profile: toUserProfile(user) },
    { message: 'Profile updated' },
  );
});
