/**
 * Creates or promotes a super-admin account.
 *
 *   npm run create:admin -- <email> [password]
 *
 * Idempotent: if the Firebase account already exists it is promoted rather
 * than recreated, and an existing password is left alone unless one is given.
 *
 * The password is only ever written to your terminal — never to the database,
 * which stores no credential at all.
 */
import { loadEnvConfig } from '@next/env';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

/** Readable, high-entropy password: 4 groups of 4 from an unambiguous set. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (let i = 0; i < 16; i += 1) {
    if (i > 0 && i % 4 === 0) out += '-';
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run create:admin -- <email> [password]');
    process.exit(1);
  }

  const suppliedPassword = process.argv[3];
  const password = suppliedPassword ?? generatePassword();

  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const userService = await import('../src/services/user.service');

  const auth = getAdminAuth();

  await mongoose.connect(process.env.MONGODB_URI as string, {
    dbName: process.env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 15_000,
  });

  let uid: string;
  let created = false;
  let passwordSet = false;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;

    // Only reset the password when one was explicitly supplied, so re-running
    // this to fix a role cannot silently lock the owner out.
    if (suppliedPassword) {
      await auth.updateUser(uid, { password: suppliedPassword });
      passwordSet = true;
    }
  } catch {
    const user = await auth.createUser({
      email,
      password,
      displayName: 'Administrator',
      emailVerified: true,
    });
    uid = user.uid;
    created = true;
    passwordSet = true;
  }

  await userService.syncFirebaseUser({
    firebaseUid: uid,
    email,
    emailVerified: true,
    name: 'Administrator',
  });

  const user = await userService.setUserRole(uid, 'super_admin');

  const line = '='.repeat(66);
  console.log(`\n${line}`);
  console.log(created ? ' ADMIN ACCOUNT CREATED' : ' EXISTING ACCOUNT PROMOTED');
  console.log(line);
  console.log(` Email     ${email}`);
  if (passwordSet) {
    console.log(` Password  ${password}`);
  } else {
    console.log(' Password  (unchanged — pass one as the 2nd argument to reset)');
  }
  console.log(` Role      ${user.role}`);
  console.log(` Sign in   /admin/login`);
  console.log(line);
  console.log(' Store this password in a password manager, then change it from');
  console.log(' the account profile page. It is not recoverable from here.');
  console.log(`${line}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to create the admin account:', error);
  process.exit(1);
});
