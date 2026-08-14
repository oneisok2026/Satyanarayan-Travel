import 'server-only';

import { connectToDatabase } from '@/lib/db/connect';
import { ContactDetail } from '@/models/ContactDetail';
import { SiteSetting } from '@/models/SiteSetting';
import { clientEnv } from '@/lib/env';
import { buildWhatsAppUrl, normalizePhone } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { ContactDetailDTO, SiteContactDTO } from '@/types';
import type { ContactDetailKind } from '@/constants';

/**
 * Contact details for the header, footer and contact page.
 *
 * These come from the database so a super admin can add, edit and remove
 * lines without a redeploy. The values in NEXT_PUBLIC_CONTACT_* remain as a
 * fallback: they are what the site showed before this became editable, and
 * keeping them means an empty collection — a fresh database, or a lookup that
 * failed — still renders a reachable phone number rather than a blank bar.
 */

/** The href for a detail, built from its kind rather than from stored text. */
function hrefFor(kind: ContactDetailKind, value: string): string {
  switch (kind) {
    case 'email':
      return `mailto:${value.trim()}`;
    case 'whatsapp':
      return buildWhatsAppUrl(value);
    case 'phone':
    default:
      return `tel:${normalizePhone(value)}`;
  }
}

function toContactDetailDTO(document: {
  _id: unknown;
  kind: ContactDetailKind;
  value: string;
  label?: string;
  placement?: string;
  isPrimary?: boolean;
}): ContactDetailDTO {
  return {
    id: String(document._id),
    kind: document.kind,
    value: document.value,
    label: document.label || undefined,
    href: hrefFor(document.kind, document.value),
    placement: (document.placement as ContactDetailDTO['placement']) ?? 'both',
    isPrimary: Boolean(document.isPrimary),
  };
}

/**
 * The details the site falls back to when the collection holds none.
 *
 * Built from the same env values the constants file used, so the rendered
 * output is unchanged from before this feature existed.
 */
function fallbackDetails(): ContactDetailDTO[] {
  const phones = [
    clientEnv.NEXT_PUBLIC_CONTACT_PHONE,
    ...clientEnv.NEXT_PUBLIC_CONTACT_PHONE_ALT.split(','),
  ]
    .map((entry) => entry.trim())
    .filter(Boolean);

  const details: ContactDetailDTO[] = phones.map((phone, index) => ({
    id: `fallback-phone-${index}`,
    kind: 'phone',
    value: phone,
    href: hrefFor('phone', phone),
    placement: 'both',
    isPrimary: index === 0,
  }));

  if (clientEnv.NEXT_PUBLIC_CONTACT_EMAIL) {
    details.push({
      id: 'fallback-email',
      kind: 'email',
      value: clientEnv.NEXT_PUBLIC_CONTACT_EMAIL,
      href: hrefFor('email', clientEnv.NEXT_PUBLIC_CONTACT_EMAIL),
      placement: 'both',
      isPrimary: true,
    });
  }

  if (clientEnv.NEXT_PUBLIC_WHATSAPP_NUMBER) {
    details.push({
      id: 'fallback-whatsapp',
      kind: 'whatsapp',
      value: clientEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
      href: hrefFor('whatsapp', clientEnv.NEXT_PUBLIC_WHATSAPP_NUMBER),
      placement: 'footer',
      isPrimary: true,
    });
  }

  return details;
}

/** Groups details by kind, resolving one primary per kind. */
function group(details: ContactDetailDTO[]): SiteContactDTO {
  const byKind = (kind: ContactDetailKind) =>
    details.filter((detail) => detail.kind === kind);

  // The explicit primary wins; otherwise the first in display order does, so
  // a surface with room for only one line is never left without one.
  const primary = (list: ContactDetailDTO[]) =>
    list.find((detail) => detail.isPrimary) ?? list[0];

  const phones = byKind('phone');
  const emails = byKind('email');
  const whatsapps = byKind('whatsapp');

  return {
    phones,
    emails,
    whatsapps,
    primaryPhone: primary(phones),
    primaryEmail: primary(emails),
    primaryWhatsapp: primary(whatsapps),
  };
}

/**
 * Every published contact line, in display order.
 *
 * Never throws: this is read by the layout that wraps every public page, so a
 * database hiccup must degrade to the env fallback rather than take the site
 * down over a row of phone numbers.
 */
export async function getSiteContact(): Promise<SiteContactDTO> {
  try {
    await connectToDatabase();

    const documents = await ContactDetail.find({ status: 'published' })
      .sort({ sortOrder: 1, createdAt: 1 })
      .limit(20)
      .lean();

    if (documents.length === 0) return group(fallbackDetails());

    return group(documents.map(toContactDetailDTO));
  } catch (error) {
    logger.warn('contact details lookup failed; using environment fallback', {
      error,
    });
    return group(fallbackDetails());
  }
}

/** Details filtered to one surface. `both` counts for either. */
export function forPlacement(
  details: ContactDetailDTO[],
  placement: 'header' | 'footer',
): ContactDetailDTO[] {
  return details.filter(
    (detail) => detail.placement === 'both' || detail.placement === placement,
  );
}

// ------------------------------------------------------- price on request --

/** Key of the setting holding the "price hidden" message. */
export const PRICE_ON_REQUEST_KEY = 'packages.priceOnRequestText';

/** Shown when a package hides its price and the admin has set no wording. */
export const PRICE_ON_REQUEST_FALLBACK = 'Contact us for more Information';

/**
 * The wording shown in place of a hidden price.
 *
 * Falls back to the default text when unset or when the lookup fails, so a
 * package with its price hidden never renders an empty gap where the figure
 * used to be.
 */
export async function getPriceOnRequestText(): Promise<string> {
  try {
    await connectToDatabase();

    const setting = await SiteSetting.findOne({ key: PRICE_ON_REQUEST_KEY })
      .select('value')
      .lean();

    const value = typeof setting?.value === 'string' ? setting.value.trim() : '';
    return value || PRICE_ON_REQUEST_FALLBACK;
  } catch (error) {
    logger.warn('price-on-request text lookup failed; using default', { error });
    return PRICE_ON_REQUEST_FALLBACK;
  }
}
