import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes, letting later conditional classes win conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** URL-safe slug. Used for packages, destinations, blog posts. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return INR.format(amount);
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/** "5 Nights / 6 Days" from night count, matching how packages are sold. */
export function formatDuration(nights: number, days: number): string {
  const n = `${nights} ${nights === 1 ? 'Night' : 'Nights'}`;
  const d = `${days} ${days === 1 ? 'Day' : 'Days'}`;
  return `${n} / ${d}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Strips HTML so descriptions can be reused as meta descriptions safely. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function absoluteUrl(path: string, base: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path.startsWith('/') ? path : `/${path}`, base).toString();
}

/** Digits-only phone for tel:/wa.me links. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function buildWhatsAppUrl(number: string, message?: string): string {
  const digits = number.replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

/**
 * A mailto: link that opens the visitor's own mail client with the message
 * already written, the email counterpart of buildWhatsAppUrl.
 *
 * encodeURIComponent, not encodeURI: the body carries newlines, ampersands
 * and colons that would otherwise be read as mailto header separators and
 * truncate the message.
 */
export function buildMailtoUrl(
  address: string,
  subject?: string,
  body?: string,
): string {
  const params = [
    subject ? `subject=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body)}` : '',
  ].filter(Boolean);

  return `mailto:${address.trim()}${params.length ? `?${params.join('&')}` : ''}`;
}

/**
 * True on phones and tablets, where the Gmail *web* compose URL does not work.
 *
 * Checked via the UA rather than a media query because this is a question
 * about the platform's mail handling, not about how wide the window is: a
 * narrow desktop browser still wants the web compose tab.
 */
function isMobilePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;

  // userAgentData is the modern signal; the UA string covers the rest,
  // including iOS, which does not implement it.
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
    .userAgentData;
  if (typeof uaData?.mobile === 'boolean') return uaData.mobile;

  return /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
    navigator.userAgent,
  );
}

/**
 * A prefilled compose window for the visitor's own mail client.
 *
 * Two different URLs, because the platforms disagree:
 *
 *  - Desktop gets Gmail's web compose (`fs=1&tf=cm`). A mailto: hand-off there
 *    is resolved by the OS and lands in whatever client is registered (Outlook
 *    on most Windows machines) rather than in the browser.
 *
 *  - Mobile gets mailto:. The /mail/u/0/ compose URL is a desktop-only view —
 *    phone browsers either redirect it to the plain inbox, dropping every
 *    prefilled field, or bounce into the Gmail app on a screen the parameters
 *    do not reach. Either way the visitor lands on their own mail with no
 *    draft, which is why enquiries reached the dashboard but no email was ever
 *    sent. mailto: is handled natively by the phone's default mail app and
 *    arrives with the subject and body already filled in.
 */
export function buildGmailComposeUrl(
  address: string,
  subject?: string,
  body?: string,
): string {
  if (isMobilePlatform()) return buildMailtoUrl(address, subject, body);

  const params = new URLSearchParams({ fs: '1', tf: 'cm', to: address.trim() });
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);

  return `https://mail.google.com/mail/u/0/?${params.toString()}`;
}

/**
 * Hand a composed message off to the visitor's mail client.
 *
 * The forms open a blank tab synchronously inside the submit gesture, because
 * a popup blocker only trusts window.open while the click is still being
 * handled. What to do with that tab then depends on the URL:
 *
 *  - An https: Gmail compose URL is a real page, so the waiting tab navigates
 *    to it.
 *  - A mailto: is a hand-off to another app, not a page. Navigating a blank
 *    tab to it leaves that tab stranded and empty behind the mail client —
 *    very visible on mobile, where it becomes an extra browser card. So the
 *    tab is closed and the hand-off is triggered from the current document.
 *
 * `composeTab` may be null when the popup was blocked outright; the https
 * fallback opens a fresh tab, which the click gesture still permits here.
 */
export function openComposeWindow(url: string, composeTab: Window | null): void {
  if (url.startsWith('mailto:')) {
    composeTab?.close();
    window.location.href = url;
    return;
  }

  if (composeTab && !composeTab.closed) composeTab.location.href = url;
  else window.open(url, '_blank', 'noopener,noreferrer');
}

/** Deterministic booking reference, e.g. STB-4F2K9A. */
export function generateBookingReference(prefix = 'STB'): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars
  let suffix = '';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `${prefix}-${suffix}`;
}
