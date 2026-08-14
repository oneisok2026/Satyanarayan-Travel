import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * "Clear all" on the notification bell.
 *
 * The feed is derived, not stored: an enquiry appears because it has no
 * `readAt`, and a booking appears because its status is `requested` or
 * `pending_confirmation`. So clearing is only safe for enquiries — the only way
 * to remove a booking from the feed is to change its status, which means
 * telling a customer their booking is confirmed or cancelled. A dismiss button
 * must never do that, and these tests pin that boundary.
 */

const SRC = join(process.cwd(), 'src');
const read = (file: string) => readFileSync(join(SRC, file), 'utf8');

const SERVICE = read('services/admin-notifications.service.ts');
const ROUTE = read('app/api/admin/notifications/route.ts');
const BELL = read('components/admin/NotificationBell.tsx');
const AUDIT = read('services/audit.service.ts');

describe('clearing never confirms a booking', () => {
  it('writes only to the Enquiry collection', () => {
    const clearBody = SERVICE.slice(SERVICE.indexOf('markAllNotificationsRead'));

    // Enquiry is marked read; Booking is only ever counted.
    expect(clearBody).toContain('Enquiry.updateMany');
    expect(clearBody).not.toMatch(/Booking\.(updateMany|updateOne|findByIdAndUpdate)/);
    expect(clearBody).toContain('Booking.countDocuments');
  });

  it('never writes a booking status from the clear path', () => {
    const clearBody = SERVICE.slice(SERVICE.indexOf('markAllNotificationsRead'));

    // A $set touching status would be exactly the silent confirmation this
    // must not perform.
    expect(clearBody).not.toMatch(/\$set:\s*\{[^}]*status/);
  });

  it('reports how many bookings were deliberately left behind', () => {
    // Without this the admin cannot tell a partial clear from a broken one.
    expect(SERVICE).toContain('remaining');
    expect(ROUTE).toContain('still awaiting confirmation');
  });
});

describe('clear is idempotent', () => {
  it('only touches enquiries that are still unread', () => {
    const clearBody = SERVICE.slice(SERVICE.indexOf('markAllNotificationsRead'));

    // readAt records when an enquiry was *first* seen; re-clearing must not
    // rewrite timestamps that already carry that information.
    expect(clearBody).toContain('readAt: { $exists: false }');
  });
});

describe('endpoint', () => {
  it('is a POST, so it cannot be triggered by a prefetch or a crawler', () => {
    expect(ROUTE).toContain('export const POST');
  });

  it('requires an authenticated admin', () => {
    const postBody = ROUTE.slice(ROUTE.indexOf('export const POST'));
    expect(postBody).toContain('requireAdmin()');
  });

  it('records the bulk action in the audit log under its own action', () => {
    // Reusing enquiry.status_changed would misreport a read as a status change.
    expect(AUDIT).toContain("'enquiry.bulk_read'");
    expect(ROUTE).toContain("action: 'enquiry.bulk_read'");
  });

  it('skips the audit entry when nothing was cleared', () => {
    // An empty clear is a no-op, not an event worth attributing.
    expect(ROUTE).toMatch(/if \(cleared > 0\)/);
  });
});

describe('bell UI', () => {
  it('offers the button only when an enquiry is present to clear', () => {
    // Shown against a booking-only list it would do nothing when pressed.
    expect(BELL).toMatch(/items\.some\(\(item\) => item\.kind === 'enquiry'\)/);
  });

  it('explains why rows remain when the button is absent', () => {
    expect(BELL).toContain('These bookings stay here until you confirm or cancel them.');
  });

  it('disables itself while the request is in flight', () => {
    expect(BELL).toContain('disabled={clearing || pending}');
    expect(BELL).toContain("{clearing ? 'Clearing…' : 'Clear all'}");
  });

  it('replaces the feed from the response rather than guessing', () => {
    // The server returns the recomputed feed, so the panel shows what actually
    // remains instead of optimistically emptying itself.
    const clearHandler = BELL.slice(BELL.indexOf('async function handleClearAll'));
    expect(clearHandler).toContain('setItems(body.data.items');
    expect(clearHandler).toContain('setTotal(body.data.total');
  });

  it('refreshes the page so any open enquiry list reflects the new read state', () => {
    const clearHandler = BELL.slice(BELL.indexOf('async function handleClearAll'));
    expect(clearHandler).toContain('router.refresh()');
  });

  it('surfaces a failure instead of appearing to succeed', () => {
    const clearHandler = BELL.slice(BELL.indexOf('async function handleClearAll'));
    expect(clearHandler).toContain('Could not clear notifications.');
  });
});
