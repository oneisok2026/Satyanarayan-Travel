import 'server-only';

import { sendEmail, adminRecipients } from '@/lib/email/provider';
import {
  adminBookingNotification,
  adminEnquiryNotification,
  customerBookingConfirmation,
  customerEnquiryConfirmation,
  type BookingEmailData,
  type EnquiryEmailData,
} from '@/lib/email/templates';
import { logger } from '@/lib/logger';

/**
 * Notification dispatch.
 *
 * Every function here is fire-and-forget from the caller's perspective: the
 * enquiry or booking is already committed, so a failed email is logged and
 * nothing more. Sends run concurrently and are settled, not awaited for
 * success, so one bad recipient cannot block the other message.
 */

export async function notifyEnquiryCreated(data: EnquiryEmailData): Promise<void> {
  const recipients = adminRecipients();

  const results = await Promise.allSettled([
    sendEmail(customerEnquiryConfirmation(data)),
    recipients.length > 0
      ? sendEmail(adminEnquiryNotification(data, recipients))
      : Promise.resolve(false),
  ]);

  logResults('enquiry', data.referenceCode, results);
}

export async function notifyBookingCreated(data: BookingEmailData): Promise<void> {
  const recipients = adminRecipients();

  const results = await Promise.allSettled([
    sendEmail(customerBookingConfirmation(data)),
    recipients.length > 0
      ? sendEmail(adminBookingNotification(data, recipients))
      : Promise.resolve(false),
  ]);

  logResults('booking', data.bookingReference, results);
}

function logResults(
  kind: string,
  reference: string,
  results: PromiseSettledResult<boolean>[],
): void {
  const failed = results.filter(
    (result) => result.status === 'rejected' || result.value === false,
  ).length;

  if (failed > 0) {
    logger.warn(`Some ${kind} notifications were not delivered`, {
      reference,
      failed,
      total: results.length,
    });
  }
}
