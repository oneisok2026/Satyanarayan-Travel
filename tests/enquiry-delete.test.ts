import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routeSource = readFileSync(
  join(process.cwd(), 'src/app/api/admin/enquiries/[id]/route.ts'),
  'utf8',
);

const pageSource = readFileSync(
  join(process.cwd(), 'src/app/admin/(dashboard)/enquiries/page.tsx'),
  'utf8',
);

const buttonSource = readFileSync(
  join(process.cwd(), 'src/components/admin/EnquiryDeleteButton.tsx'),
  'utf8',
);

/**
 * Deleting an enquiry destroys customer data with no archived state to fall
 * back on, so the role gate is asserted at the route — the hidden button is
 * only a convenience.
 */
describe('enquiry deletion', () => {
  it('exposes a DELETE route', () => {
    expect(routeSource).toContain('export const DELETE');
  });

  it('requires super_admin, not merely an admin', () => {
    const deleteAt = routeSource.indexOf('export const DELETE');
    const handler = routeSource.slice(deleteAt);

    expect(handler).toContain('requireSuperAdmin()');
    // The weaker guard must not be what protects this handler.
    expect(handler.slice(0, handler.indexOf('deleteEnquiry'))).not.toContain(
      'requireAdmin()',
    );
  });

  it('validates the id before touching the database', () => {
    const handler = routeSource.slice(routeSource.indexOf('export const DELETE'));
    const parsedAt = handler.indexOf('objectIdSchema.parse');
    const deletedAt = handler.indexOf('deleteEnquiry(');

    expect(parsedAt).toBeGreaterThan(-1);
    expect(parsedAt).toBeLessThan(deletedAt);
  });

  it('records an audit entry that outlives the deleted record', () => {
    const handler = routeSource.slice(routeSource.indexOf('export const DELETE'));
    expect(handler).toContain("action: 'enquiry.deleted'");
    // Identifying details must be captured, since the enquiry is gone.
    expect(handler).toContain('referenceCode: removed.referenceCode');
  });

  it('keeps the status change available to plain admins', () => {
    // Deletion is restricted; ordinary triage must not be.
    const patchAt = routeSource.indexOf('export const PATCH');
    const deleteAt = routeSource.indexOf('export const DELETE');
    expect(routeSource.slice(patchAt, deleteAt)).toContain('requireAdmin()');
  });

  it('renders the button only for super admins', () => {
    expect(pageSource).toContain("admin.role === 'super_admin'");
    expect(pageSource).toContain('canDelete && (');
  });

  it('confirms before deleting, and warns it cannot be undone', () => {
    expect(buttonSource).toContain('ConfirmDialog');
    expect(buttonSource).toContain('destructive');
    expect(buttonSource).toMatch(/cannot be undone/i);
  });

  it('refreshes the list after a successful delete', () => {
    expect(buttonSource).toContain('router.refresh()');
  });
});
