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
