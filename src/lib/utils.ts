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
 * Gmail's web compose window, prefilled.
 *
 * Preferred over mailto: because a mailto: hand-off is resolved by the OS and
 * lands in whatever desktop client is registered (Outlook on most Windows
 * machines) rather than in the browser. This opens a compose tab instead, the
 * browser-side counterpart of the wa.me link.
 *
 * `fs=1` forces the full compose view, and `tf=cm` selects compose mode; both
 * are required for the /mail/u/0/ path to honour the prefilled fields.
 */
export function buildGmailComposeUrl(
  address: string,
  subject?: string,
  body?: string,
): string {
  const params = new URLSearchParams({ fs: '1', tf: 'cm', to: address.trim() });
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);

  return `https://mail.google.com/mail/u/0/?${params.toString()}`;
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
