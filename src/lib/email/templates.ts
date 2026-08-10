import 'server-only';

import { clientEnv } from '@/lib/env';
import type { EmailMessage } from './provider';

/**
 * Transactional email bodies.
 *
 * Every interpolated value is HTML-escaped: enquiry text is attacker-supplied
 * and would otherwise inject markup into the admin's inbox.
 */

const siteName = clientEnv.NEXT_PUBLIC_SITE_NAME;
const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f7f5f2;font-family:-apple-system,'Segoe UI',sans-serif;color:#2b2926;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 20px;font-size:20px;color:#1c4f4c;">${escapeHtml(heading)}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px;">
    <p style="margin:0;font-size:12px;color:#8a8681;">${escapeHtml(siteName)}</p>
  </div>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#6b6862;font-size:14px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:500;">${escapeHtml(value)}</td>
  </tr>`;
}

export interface EnquiryEmailData {
  referenceCode: string;
  name: string;
  email: string;
  phone: string;
  packageTitle?: string;
  travelDate?: string;
  travellers?: string;
  budget?: string;
  message?: string;
  type: string;
}

export function customerEnquiryConfirmation(data: EnquiryEmailData): EmailMessage {
  const html = layout(
    'We have received your enquiry',
    `<p style="font-size:15px;line-height:1.6;">Hi ${escapeHtml(data.name)},</p>
     <p style="font-size:15px;line-height:1.6;">
       Thank you for getting in touch. Our travel team will review your enquiry and
       respond within one working day.
     </p>
     <table style="width:100%;border-collapse:collapse;margin:20px 0;">
       ${row('Reference', data.referenceCode)}
       ${data.packageTitle ? row('Package', data.packageTitle) : ''}
       ${data.travelDate ? row('Travel date', data.travelDate) : ''}
     </table>
     <p style="font-size:14px;color:#6b6862;">
       Please quote your reference when contacting us.
     </p>`,
  );

  const text = `Hi ${data.name},

Thank you for your enquiry. Our team will respond within one working day.

Reference: ${data.referenceCode}${data.packageTitle ? `\nPackage: ${data.packageTitle}` : ''}

${siteName}
${siteUrl}`;

  return {
    to: data.email,
    subject: `Enquiry received — ${data.referenceCode}`,
    html,
    text,
  };
}

export function adminEnquiryNotification(
  data: EnquiryEmailData,
  recipients: string[],
): EmailMessage {
  const html = layout(
    `New ${data.type.replace('_', ' ')} enquiry`,
    `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
       ${row('Reference', data.referenceCode)}
       ${row('Name', data.name)}
       ${row('Email', data.email)}
       ${row('Phone', data.phone)}
       ${data.packageTitle ? row('Package', data.packageTitle) : ''}
       ${data.travelDate ? row('Travel date', data.travelDate) : ''}
       ${data.travellers ? row('Travellers', data.travellers) : ''}
       ${data.budget ? row('Budget', data.budget) : ''}
     </table>
     ${
       data.message
         ? `<p style="font-size:14px;color:#6b6862;margin:0 0 6px;">Message</p>
            <p style="font-size:15px;line-height:1.6;background:#f7f5f2;padding:12px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(data.message)}</p>`
         : ''
     }
     <p style="margin-top:24px;">
       <a href="${siteUrl}/admin/enquiries" style="background:#c2562f;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px;">Open in admin</a>
     </p>`,
  );

  const text = `New enquiry ${data.referenceCode}
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}${data.packageTitle ? `\nPackage: ${data.packageTitle}` : ''}${data.message ? `\n\n${data.message}` : ''}

${siteUrl}/admin/enquiries`;

  return {
    to: recipients,
    subject: `New enquiry: ${data.name} — ${data.referenceCode}`,
    html,
    text,
    // Lets an admin reply straight to the customer.
    replyTo: data.email,
  };
}

export interface BookingEmailData {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  packageTitle: string;
  travelDate: string;
  travellers: number;
  total: string;
}

export function customerBookingConfirmation(data: BookingEmailData): EmailMessage {
  const html = layout(
    'Your booking request is confirmed as received',
    `<p style="font-size:15px;line-height:1.6;">Hi ${escapeHtml(data.customerName)},</p>
     <p style="font-size:15px;line-height:1.6;">
       We have received your booking request. Our team will confirm availability and
       contact you shortly with the next steps.
     </p>
     <table style="width:100%;border-collapse:collapse;margin:20px 0;">
       ${row('Booking reference', data.bookingReference)}
       ${row('Package', data.packageTitle)}
       ${row('Travel date', data.travelDate)}
       ${row('Travellers', String(data.travellers))}
       ${row('Estimated total', data.total)}
     </table>
     <p style="font-size:13px;color:#8a8681;">
       This is a booking request, not a confirmed reservation. Your booking is
       confirmed only once our team has verified availability with you.
     </p>`,
  );

  const text = `Hi ${data.customerName},

We have received your booking request.

Reference: ${data.bookingReference}
Package: ${data.packageTitle}
Travel date: ${data.travelDate}
Travellers: ${data.travellers}
Estimated total: ${data.total}

This is a request, not a confirmed reservation.

${siteName}`;

  return {
    to: data.customerEmail,
    subject: `Booking request received — ${data.bookingReference}`,
    html,
    text,
  };
}

export function adminBookingNotification(
  data: BookingEmailData,
  recipients: string[],
): EmailMessage {
  const html = layout(
    'New booking request',
    `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
       ${row('Reference', data.bookingReference)}
       ${row('Customer', data.customerName)}
       ${row('Email', data.customerEmail)}
       ${row('Package', data.packageTitle)}
       ${row('Travel date', data.travelDate)}
       ${row('Travellers', String(data.travellers))}
       ${row('Total', data.total)}
     </table>
     <p style="margin-top:24px;">
       <a href="${siteUrl}/admin/bookings" style="background:#c2562f;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px;">Open in admin</a>
     </p>`,
  );

  const text = `New booking ${data.bookingReference}
Customer: ${data.customerName} (${data.customerEmail})
Package: ${data.packageTitle}
Travel date: ${data.travelDate}
Total: ${data.total}

${siteUrl}/admin/bookings`;

  return {
    to: recipients,
    subject: `New booking: ${data.packageTitle} — ${data.bookingReference}`,
    html,
    text,
    replyTo: data.customerEmail,
  };
}

export function enquiryStatusUpdate(data: {
  name: string;
  email: string;
  referenceCode: string;
  status: string;
}): EmailMessage {
  const html = layout(
    'Update on your enquiry',
    `<p style="font-size:15px;line-height:1.6;">Hi ${escapeHtml(data.name)},</p>
     <p style="font-size:15px;line-height:1.6;">
       There is an update on your enquiry <strong>${escapeHtml(data.referenceCode)}</strong>.
       Our team will be in touch with the details.
     </p>`,
  );

  return {
    to: data.email,
    subject: `Update on your enquiry — ${data.referenceCode}`,
    html,
    text: `Hi ${data.name},\n\nThere is an update on your enquiry ${data.referenceCode}.\n\n${siteName}`,
  };
}
