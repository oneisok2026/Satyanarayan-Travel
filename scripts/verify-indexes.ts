/**
 * Syncs every schema's indexes to MongoDB and verifies the required ones
 * exist. Safe to re-run; syncIndexes() is idempotent.
 *
 *   npm run verify:indexes
 */
// Named import: tsx compiles this to CJS, where the default export of
// @next/env is the module namespace rather than the helper object.
import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

const REQUIRED: Record<string, string[]> = {
  User: ['firebaseUid_1'],
  Destination: ['slug_1', 'status_1_sortOrder_1'],
  Category: ['slug_1'],
  TourPackage: [
    'slug_1',
    'status_1_createdAt_-1',
    'type_1_status_1_createdAt_-1',
    'featured_1_status_1',
    'destinationIds_1_status_1',
    'categoryId_1_status_1',
  ],
  Enquiry: [
    'status_1_createdAt_-1',
    'userId_1_createdAt_-1',
    'packageId_1_createdAt_-1',
  ],
  Booking: ['bookingReference_1', 'userId_1_createdAt_-1', 'status_1_createdAt_-1'],
  Favourite: ['userId_1_packageId_1'],
  Review: ['packageId_1_status_1_createdAt_-1'],
  BlogPost: ['slug_1', 'status_1_publishedAt_-1'],
  GalleryItem: ['status_1_albumSlug_1_sortOrder_1'],
  Service: ['slug_1'],
  SiteSetting: ['key_1'],
  AuditLog: ['createdAt_-1'],
};

async function main(): Promise<void> {
  const models = await import('../src/models/index');

  await mongoose.connect(process.env.MONGODB_URI as string, {
    dbName: process.env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 15_000,
  });

  const results: { name: string; ok: boolean; detail: string }[] = [];
  let registered = 0;

  for (const [name, required] of Object.entries(REQUIRED)) {
    const model = (models as unknown as Record<string, mongoose.Model<unknown>>)[name];

    if (!model) {
      results.push({ name, ok: false, detail: 'MODEL NOT REGISTERED' });
      continue;
    }
    registered += 1;

    await model.syncIndexes();
    const indexes = await model.collection.indexes();
    const built = indexes.map((index) => String(index.name));
    const missing = required.filter((name) => !built.includes(name));
    const unique = indexes
      .filter((index) => index.unique)
      .map((index) => String(index.name));

    results.push({
      name,
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? `${built.length} indexes | unique: ${unique.join(', ') || 'none'}`
          : `MISSING ${missing.join(', ')}`,
    });
  }

  const line = '='.repeat(74);
  console.log(`\n${line}\n DATABASE INDEX VERIFICATION\n${line}`);
  for (const result of results) {
    console.log(
      ` ${result.ok ? 'PASS' : 'FAIL'}  ${result.name.padEnd(13)} ${result.detail}`,
    );
  }

  const failed = results.filter((result) => !result.ok).length;
  console.log(line);
  console.log(
    ` Models registered: ${registered}/13   ` +
      `${results.length - failed}/${results.length} index checks passed`,
  );

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Index verification failed:', error);
  process.exit(1);
});
