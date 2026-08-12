import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppUrl,
  buildMailtoUrl,
  buildGmailComposeUrl,
  normalizePhone,
} from '@/lib/utils';

/** The agency's published contact points. */
const WHATSAPP = '918910102904';
const EMAIL = 'satyanarayantourandtravel@gmail.com';

describe('whatsapp routing', () => {
  it('builds a wa.me link for the agency number', () => {
    expect(buildWhatsAppUrl(WHATSAPP)).toBe('https://wa.me/918910102904');
  });

  it('strips punctuation and the plus so a formatted number still routes', () => {
    for (const variant of ['+91 89101 02904', '+91-89101-02904', '918910102904']) {
      expect(buildWhatsAppUrl(variant)).toBe('https://wa.me/918910102904');
    }
  });

  it('carries the prefilled message as an encoded query', () => {
    const url = buildWhatsAppUrl(WHATSAPP, 'Hello! I would like a quote.');
    expect(url.startsWith('https://wa.me/918910102904?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('Hello! I would like a quote.'));
  });

  it('keeps the leading plus for tel: links', () => {
    expect(normalizePhone('+91 89101 02904')).toBe('+918910102904');
  });
});

describe('mailto routing', () => {
  it('addresses the agency mailbox', () => {
    expect(buildMailtoUrl(EMAIL)).toBe(`mailto:${EMAIL}`);
  });

  it('carries the subject and body as encoded parameters', () => {
    const url = buildMailtoUrl(EMAIL, 'General enquiry — Asha (ENQ-1)', 'Name: Asha');
    expect(url).toContain(`mailto:${EMAIL}?`);
    expect(url).toContain(`subject=${encodeURIComponent('General enquiry — Asha (ENQ-1)')}`);
    expect(url).toContain(`body=${encodeURIComponent('Name: Asha')}`);
  });

  it('encodes newlines and ampersands so the body is not truncated', () => {
    // A raw & would start a new mailto header and drop everything after it.
    const url = buildMailtoUrl(EMAIL, 'Subject', 'Line one\nB & B\nLine three');
    expect(url).toContain('%0A');
    expect(url).toContain('%26');
    // Exactly one separator: the one introducing the query.
    expect(url.split('?').length).toBe(2);
  });

  it('omits the query entirely when there is nothing to prefill', () => {
    expect(buildMailtoUrl(EMAIL)).not.toContain('?');
  });
});

describe('gmail compose routing', () => {
  it('opens Gmail web compose addressed to the agency', () => {
    const url = new URL(buildGmailComposeUrl(EMAIL));
    expect(url.origin).toBe('https://mail.google.com');
    expect(url.pathname).toBe('/mail/u/0/');
    expect(url.searchParams.get('to')).toBe(EMAIL);
  });

  it('requests the full compose view', () => {
    const params = new URL(buildGmailComposeUrl(EMAIL)).searchParams;
    expect(params.get('fs')).toBe('1');
    expect(params.get('tf')).toBe('cm');
  });

  it('prefills subject and body under Gmail parameter names', () => {
    const body = 'Reference: ENQ-1\nName: Asha\nNote: B & B';
    const params = new URL(
      buildGmailComposeUrl(EMAIL, 'Tour package enquiry — Asha', body),
    ).searchParams;

    // Gmail uses su, not subject.
    expect(params.get('su')).toBe('Tour package enquiry — Asha');
    // Newlines and ampersands must survive the round trip intact.
    expect(params.get('body')).toBe(body);
  });

  it('is an https URL a browser opens directly, not an OS hand-off', () => {
    expect(buildGmailComposeUrl(EMAIL).startsWith('https://')).toBe(true);
    expect(buildGmailComposeUrl(EMAIL)).not.toContain('mailto:');
  });
});
