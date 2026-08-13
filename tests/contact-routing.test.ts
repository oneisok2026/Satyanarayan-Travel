import { afterEach, describe, expect, it } from 'vitest';
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

/**
 * The /mail/u/0/ compose view is desktop-only: phone browsers redirect it to
 * the plain inbox or bounce into the Gmail app, dropping every prefilled
 * field, so the visitor lands on their own mail with nothing to send. Mobile
 * gets a mailto: instead, which the phone's default mail app fills in.
 */
describe('gmail compose routing on mobile', () => {
  const originalNavigator = globalThis.navigator;

  function setNavigator(value: unknown) {
    Object.defineProperty(globalThis, 'navigator', {
      value,
      configurable: true,
      writable: true,
    });
  }

  afterEach(() => {
    setNavigator(originalNavigator);
  });

  it('hands off via mailto: when userAgentData reports a mobile device', () => {
    setNavigator({ userAgent: '', userAgentData: { mobile: true } });
    expect(buildGmailComposeUrl(EMAIL).startsWith('mailto:')).toBe(true);
  });

  it('hands off via mailto: on Android and iOS user agents', () => {
    for (const ua of [
      'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1',
    ]) {
      setNavigator({ userAgent: ua });
      expect(buildGmailComposeUrl(EMAIL).startsWith('mailto:')).toBe(true);
    }
  });

  it('still prefills subject and body in the mobile hand-off', () => {
    setNavigator({ userAgent: '', userAgentData: { mobile: true } });

    const body = 'Reference: ENQ-1\nName: Asha\nNote: B & B';
    const url = buildGmailComposeUrl(EMAIL, 'Tour package enquiry — Asha', body);
    const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));

    expect(url.startsWith(`mailto:${EMAIL}?`)).toBe(true);
    expect(params.get('subject')).toBe('Tour package enquiry — Asha');
    expect(params.get('body')).toBe(body);
  });

  it('keeps the Gmail web tab on desktop user agents', () => {
    setNavigator({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      userAgentData: { mobile: false },
    });
    expect(buildGmailComposeUrl(EMAIL).startsWith('https://mail.google.com')).toBe(true);
  });
});
