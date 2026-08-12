import { NextResponse, type NextRequest } from 'next/server';
import { Readable } from 'node:stream';
import { route } from '@/lib/api-handler';
import { openImage } from '@/lib/db/image-store';

export const runtime = 'nodejs';

/**
 * GET — serve an image stored in GridFS.
 *
 * Deliberately public and unauthenticated: these are cover images on public
 * pages, and the id is an opaque ObjectId rather than a guessable path.
 *
 * Content is immutable — a replaced image gets a new id — so it is cached
 * hard, and an ETag lets a repeat visitor revalidate with a 304 instead of
 * re-downloading. That matters more here than with a CDN-backed bucket,
 * because every uncached hit costs a database read.
 */
export const GET = route<{ params: Promise<{ id: string }> }>(
  'GET /api/images/[id]',
  async (request: NextRequest, { params }) => {
    const { id } = await params;
    const image = await openImage(id);

    const etag = `"${id}-${image.uploadDate.getTime()}"`;

    if (request.headers.get('if-none-match') === etag) {
      // Stream is abandoned unread; GridFS cleans it up when it is GC'd.
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    }

    return new NextResponse(
      Readable.toWeb(image.stream as Readable) as ReadableStream,
      {
        status: 200,
        headers: {
          'Content-Type': image.contentType,
          'Content-Length': String(image.sizeBytes),
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: etag,
          // The bytes were type-checked on upload, but this guarantees a
          // browser never re-interprets them as something executable.
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  },
);
