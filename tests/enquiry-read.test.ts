import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const serviceSource = readFileSync(
  join(process.cwd(), 'src/services/enquiry.service.ts'),
  'utf8',
);

const feedSource = readFileSync(
  join(process.cwd(), 'src/services/admin-notifications.service.ts'),
  'utf8',
);

const buttonSource = readFileSync(
  join(process.cwd(), 'src/components/admin/EnquiryViewButton.tsx'),
  'utf8',
);

const routeSource = readFileSync(
  join(process.cwd(), 'src/app/api/admin/enquiries/[id]/route.ts'),
  'utf8',
);

/**
 * The badge counted status:'new', which viewing never changed — so an
 * already-read enquiry kept being reported. Read state is now tracked
 * separately from the workflow status.
 */
describe('enquiry read state', () => {
  it('drives the notification feed from readAt, not the workflow status', () => {
    expect(feedSource).toContain('readAt: { $exists: false }');
    expect(feedSource).not.toContain("Enquiry.find({ status: 'new' })");
    expect(feedSource).not.toContain("Enquiry.countDocuments({ status: 'new' })");
  });

  it('does not advance the status, which would misreport the work done', () => {
    const fn = serviceSource.slice(serviceSource.indexOf('markEnquiryRead'));
    const body = fn.slice(0, fn.indexOf('\n}'));
    expect(body).toContain('readAt');
    expect(body).not.toContain("status: 'contacted'");
  });

  it('is first-write-wins, so a later view cannot reset the timestamp', () => {
    const fn = serviceSource.slice(serviceSource.indexOf('markEnquiryRead'));
    // The filter itself excludes already-read records.
    expect(fn.slice(0, fn.indexOf('\n}'))).toContain('readAt: { $exists: false } }');
  });

  it('distinguishes an already-read enquiry from a missing one', () => {
    const fn = serviceSource.slice(serviceSource.indexOf('markEnquiryRead'));
    expect(fn.slice(0, fn.indexOf('\n}'))).toContain("notFound('Enquiry')");
  });

  it('marks read when the dialog opens, and skips a repeat call', () => {
    expect(buttonSource).toContain('read: true');
    expect(buttonSource).toContain('if (enquiry.readAt) return;');
  });

  it('never blocks the admin on the request failing', () => {
    // Fire-and-forget: the dialog is already open before the fetch resolves.
    const handler = buttonSource.slice(buttonSource.indexOf('function handleOpen'));
    expect(handler.indexOf('setOpen(true)')).toBeLessThan(handler.indexOf('fetch('));
    expect(handler).toContain('.catch(() => undefined)');
  });

  it('exposes the branch on the existing PATCH route', () => {
    expect(routeSource).toContain("'read' in body");
    expect(routeSource).toContain('markEnquiryRead(enquiryId)');
  });
});
