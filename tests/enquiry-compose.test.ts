import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGmailComposeUrl } from '@/lib/utils';

const source = readFileSync(
  join(process.cwd(), 'src/components/enquiry/EnquiryForm.tsx'),
  'utf8',
);

/**
 * The compose hand-off is a browser navigation, so it is asserted at the
 * source level: the tab must be claimed inside the click gesture, the
 * enquiry saved before the draft opens, and the address taken from config.
 */
describe('enquiry compose hand-off', () => {
  it('claims the tab synchronously, before the network call', () => {
    // window.open after an await is treated as untrusted and blocked.
    const openedAt = source.indexOf("window.open('', '_blank')");
    const fetchAt = source.indexOf('await fetch(');

    expect(openedAt).toBeGreaterThan(-1);
    expect(openedAt).toBeLessThan(fetchAt);
  });

  it('points the tab at the draft only after the enquiry is stored', () => {
    const savedAt = source.indexOf('setReference(referenceCode)');
    const openedAt = source.indexOf('composeTab.location.href = url');

    expect(savedAt).toBeGreaterThan(-1);
    expect(openedAt).toBeGreaterThan(savedAt);
  });

  it('closes the waiting tab when nothing was saved', () => {
    expect(source).toContain('composeTab?.close()');
  });

  it('severs window.opener on the tab it opens', () => {
    expect(source).toContain('composeTab.opener = null');
  });

  it('addresses the agency mailbox from config, not a literal', () => {
    expect(source).toContain('buildGmailComposeUrl(CONTACT.email');
    expect(source).not.toMatch(/mailto:[a-z0-9.]+@/i);
  });

  it('keeps a re-open link on the success panel', () => {
    expect(source).toContain('Open it again');
  });

  it('produces a draft whose body survives encoding', () => {
    // Mirrors what composeEmail emits: newline-separated label/value lines.
    const body = ['Reference: ENQ-1', '', 'Name: Asha', 'Message:', 'B & B please'].join('\n');
    const url = buildGmailComposeUrl('agency@example.com', 'Enquiry — Asha', body);
    const parsed = new URL(url).searchParams;

    expect(parsed.get('body')).toBe(body);
    expect(parsed.get('su')).toBe('Enquiry — Asha');
  });
});
