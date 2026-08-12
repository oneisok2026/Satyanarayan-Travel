import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routeSource = readFileSync(
  join(process.cwd(), 'src/app/api/admin/bookings/[id]/route.ts'),
  'utf8',
);

const pageSource = readFileSync(
  join(process.cwd(), 'src/app/admin/(dashboard)/bookings/page.tsx'),
  'utf8',
);

const controlsSource = readFileSync(
  join(process.cwd(), 'src/components/admin/BookingStatusControls.tsx'),
  'utf8',
);

const deleteSource = readFileSync(
  join(process.cwd(), 'src/components/admin/BookingDeleteButton.tsx'),
  'utf8',
);

const viewSource = readFileSync(
  join(process.cwd(), 'src/components/admin/BookingViewButton.tsx'),
  'utf8',
);

/**
 * Deleting a booking destroys customer data with no archived state to fall
 * back on, so the role gate is asserted at the route — the hidden button is
 * only a convenience.
 */
describe('booking deletion', () => {
  it('exposes a DELETE route', () => {
    expect(routeSource).toContain('export const DELETE');
  });

  it('requires super_admin, not merely an admin', () => {
    const handler = routeSource.slice(routeSource.indexOf('export const DELETE'));
    expect(handler).toContain('requireSuperAdmin()');
    expect(handler.slice(0, handler.indexOf('deleteBooking'))).not.toContain(
      'requireAdmin()',
    );
  });

  it('validates the id before touching the database', () => {
    const handler = routeSource.slice(routeSource.indexOf('export const DELETE'));
    const parsedAt = handler.indexOf('objectIdSchema.parse');
    const deletedAt = handler.indexOf('deleteBooking(');
    expect(parsedAt).toBeGreaterThan(-1);
    expect(parsedAt).toBeLessThan(deletedAt);
  });

  it('records an audit entry that outlives the deleted record', () => {
    const handler = routeSource.slice(routeSource.indexOf('export const DELETE'));
    expect(handler).toContain("action: 'booking.deleted'");
    expect(handler).toContain('bookingReference: removed.bookingReference');
  });

  it('leaves status changes available to plain admins', () => {
    const patch = routeSource.slice(
      routeSource.indexOf('export const PATCH'),
      routeSource.indexOf('export const DELETE'),
    );
    expect(patch).toContain('requireAdmin()');
  });

  it('renders the button only for super admins', () => {
    expect(pageSource).toContain("admin.role === 'super_admin'");
    expect(pageSource).toContain('canDelete && (');
  });

  it('confirms before deleting, and warns it cannot be undone', () => {
    expect(deleteSource).toContain('ConfirmDialog');
    expect(deleteSource).toContain('destructive');
    expect(deleteSource).toMatch(/cannot be undone/i);
  });
});

describe('booking row actions', () => {
  it('offers a view dialog with the full detail', () => {
    expect(pageSource).toContain('<BookingViewButton');
    expect(viewSource).toContain('Modal');
    // The notes are the reason to open it at all.
    expect(viewSource).toContain('booking.notes');
  });

  it('no longer shows a payment control on the row', () => {
    expect(controlsSource).not.toContain('PAYMENT_STATUSES');
    expect(controlsSource).not.toContain('paymentStatus');
    expect(pageSource).not.toContain('All payments');
  });

  it('keeps the booking status control working', () => {
    expect(controlsSource).toContain('BOOKING_STATUSES');
    expect(controlsSource).toContain("JSON.stringify({ status: next })");
  });
});
