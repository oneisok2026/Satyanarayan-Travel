import 'server-only';

import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Email transport abstraction.
 *
 * A send failure must never roll back a database mutation the customer
 * already completed (PRD §25: "Make notification failures non-destructive to
 * successful database mutations"), so every function here resolves rather
 * than throws, and reports success as a boolean.
 *
 * With EMAIL_PROVIDER unset the whole layer is a logged no-op, which keeps
 * development and unconfigured deployments working.
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const env = serverEnv();

  if (env.EMAIL_PROVIDER === '') {
    logger.info('Email skipped (no provider configured)', {
      subject: message.subject,
      recipients: Array.isArray(message.to) ? message.to.length : 1,
    });
    return false;
  }

  try {
    if (env.EMAIL_PROVIDER === 'resend') return await sendViaResend(message, env);
    if (env.EMAIL_PROVIDER === 'smtp') return await sendViaSmtp(message);
    return false;
  } catch (error) {
    // Swallowed deliberately — see the module note above.
    logger.error('Email send failed', {
      subject: message.subject,
      provider: env.EMAIL_PROVIDER,
      error: error instanceof Error ? error : String(error),
    });
    return false;
  }
}

async function sendViaResend(
  message: EmailMessage,
  env: ReturnType<typeof serverEnv>,
): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    logger.warn('EMAIL_PROVIDER=resend but RESEND_API_KEY is missing');
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
    // Never let a hung provider hold a request open.
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Body may contain the key or recipient details; log status only.
    logger.error('Resend rejected the message', { status: response.status });
    return false;
  }

  return true;
}

/**
 * SMTP is declared but not wired: adding nodemailer for a provider that may
 * never be used would ship an unnecessary dependency. Configure Resend, or
 * install nodemailer and implement here.
 */
async function sendViaSmtp(message: EmailMessage): Promise<boolean> {
  logger.warn('SMTP provider selected but not implemented; email not sent', {
    subject: message.subject,
  });
  return false;
}

export function adminRecipients(): string[] {
  return serverEnv()
    .EMAIL_ADMIN_RECIPIENTS.split(',')
    .map((address) => address.trim())
    .filter((address) => address.length > 0);
}
