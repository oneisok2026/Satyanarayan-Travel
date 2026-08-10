import 'server-only';

import type { DecodedIdToken } from 'firebase-admin/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { User, type UserDocument } from '@/models/User';
import { setRoleClaim } from '@/lib/firebase/session';
import { logger } from '@/lib/logger';
import { accountSuspended, notFound } from '@/lib/errors';
import type { SessionUser, UserProfileDTO } from '@/types';
import type { UserRole } from '@/constants';

/**
 * Firebase ↔ MongoDB user synchronization.
 *
 * Every authenticated Firebase user gets exactly one MongoDB record, bridged
 * by `firebaseUid`. Email is never the identity key: it is mutable in Firebase
 * and can be shared across providers, so matching on it would either merge
 * distinct accounts or create duplicates.
 */

/** Fields Firebase owns. Everything else on the record belongs to the app. */
interface FirebaseProfileInput {
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  photoURL?: string;
}

/**
 * Resolves the application user for an authenticated Firebase identity,
 * creating it on first sight.
 *
 * Uses a single atomic upsert rather than find-then-create: two parallel
 * requests during first sign-in would both see "no user" and both insert.
 * The unique index on firebaseUid would reject the loser with E11000 and fail
 * an otherwise valid sign-in.
 */
export async function syncFirebaseUser(
  input: FirebaseProfileInput,
): Promise<UserDocument> {
  await connectToDatabase();

  const now = new Date();

  const user = await User.findOneAndUpdate(
    { firebaseUid: input.firebaseUid },
    {
      // Applied on every sign-in: Firebase is authoritative for these.
      $set: {
        email: input.email.toLowerCase(),
        emailVerified: input.emailVerified,
        lastLoginAt: now,
      },
      // Applied only on insert. Role and status are deliberately here and
      // never in $set — otherwise every sign-in would reset an admin back to
      // customer and silently un-suspend banned accounts.
      $setOnInsert: {
        firebaseUid: input.firebaseUid,
        role: 'customer',
        status: 'active',
        preferences: { marketingEmails: true, whatsappUpdates: true },
        profile: {},
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  ).exec();

  if (!user) {
    throw notFound('User');
  }

  // Name and photo only fill gaps — a user who edits their profile in the app
  // must not have it overwritten by a stale Firebase displayName.
  const patch: Record<string, string> = {};
  if (input.name?.trim() && (!user.name || user.name === 'Traveller')) {
    patch.name = input.name.trim();
  }
  if (input.photoURL && !user.photoURL) {
    patch.photoURL = input.photoURL;
  }

  if (Object.keys(patch).length > 0) {
    Object.assign(user, patch);
    await user.save();
  }

  return user;
}

/**
 * Resolves the MongoDB user from a verified Firebase token and enforces
 * account status. This is the authorization chokepoint: role always comes
 * from this record, never from the token's custom claims.
 */
export async function resolveAuthenticatedUser(
  decoded: DecodedIdToken,
): Promise<UserDocument> {
  const user = await syncFirebaseUser({
    firebaseUid: decoded.uid,
    email: decoded.email ?? '',
    emailVerified: decoded.email_verified ?? false,
    name: decoded.name as string | undefined,
    photoURL: decoded.picture,
  });

  if (user.status === 'suspended') {
    logger.warn('Suspended account attempted access', { firebaseUid: user.firebaseUid });
    throw accountSuspended();
  }

  if (user.status === 'deleted') {
    logger.warn('Deleted account attempted access', { firebaseUid: user.firebaseUid });
    throw accountSuspended('This account is no longer active.');
  }

  return user;
}

export async function findUserByFirebaseUid(
  firebaseUid: string,
): Promise<UserDocument | null> {
  await connectToDatabase();
  return User.findOne({ firebaseUid }).exec();
}

/**
 * Changes a user's role. Writes MongoDB first — it is authoritative — then
 * mirrors to a Firebase custom claim used only as a client-side hint.
 * A claim-sync failure is logged, not thrown: the authoritative record is
 * already correct and server checks read from it.
 */
export async function setUserRole(
  firebaseUid: string,
  role: UserRole,
): Promise<UserDocument> {
  await connectToDatabase();

  const user = await User.findOneAndUpdate(
    { firebaseUid },
    { $set: { role } },
    { new: true, runValidators: true },
  ).exec();

  if (!user) throw notFound('User');

  try {
    await setRoleClaim(firebaseUid, role);
  } catch (error) {
    logger.error('Role updated in MongoDB but Firebase claim sync failed', {
      firebaseUid,
      role,
      error: error instanceof Error ? error : String(error),
    });
  }

  logger.info('User role changed', { firebaseUid, role });
  return user;
}

export function toSessionUser(user: UserDocument): SessionUser {
  return {
    id: String(user._id),
    firebaseUid: user.firebaseUid,
    email: user.email,
    name: user.name,
    phone: user.phone,
    photoURL: user.photoURL,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  };
}

export function toUserProfile(user: UserDocument): UserProfileDTO {
  return {
    ...toSessionUser(user),
    profile: {
      address: user.profile?.address,
      city: user.profile?.city,
      state: user.profile?.state,
      country: user.profile?.country,
      postalCode: user.profile?.postalCode,
      dateOfBirth: user.profile?.dateOfBirth?.toISOString(),
      // passportNumber is select:false and intentionally not surfaced here.
    },
    preferences: {
      marketingEmails: user.preferences?.marketingEmails ?? true,
      whatsappUpdates: user.preferences?.whatsappUpdates ?? true,
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
