import 'server-only';

import { AppError, ERROR_CODES } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Spam heuristics for public forms.
 *
 * Deliberately conservative: a false positive silently loses a real customer
 * enquiry, which is worse for this business than an occasional spam row.
 */

const MIN_FILL_SECONDS = 3;

interface SpamCheckInput {
  /** Honeypot field. Any content means a bot filled every input. */
  honeypot?: string;
  /** Client timestamp of form render, for the timing check. */
  formLoadedAt?: number;
  message?: string;
  name?: string;
}

export function assertNotSpam(input: SpamCheckInput, context: string): void {
  if (input.honeypot && input.honeypot.trim() !== '') {
    logger.warn('Spam rejected: honeypot filled', { context });
    throw spamError();
  }

  if (input.formLoadedAt) {
    const elapsedSeconds = (Date.now() - input.formLoadedAt) / 1000;
    // Negative elapsed means a forged/skewed timestamp — treat as suspicious.
    if (elapsedSeconds < MIN_FILL_SECONDS) {
      logger.warn('Spam rejected: submitted too quickly', { context, elapsedSeconds });
      throw spamError();
    }
  }

  if (input.message && looksLikeSpamContent(input.message)) {
    logger.warn('Spam rejected: content heuristics', { context });
    throw spamError();
  }
}

const LINK_PATTERN = /(https?:\/\/|www\.)/gi;
const SPAM_PHRASES =
  /\b(viagra|casino|crypto\s*giveaway|forex\s*signals|seo\s*services|backlinks?|loan\s*offer|bitcoin\s*investment)\b/i;

function looksLikeSpamContent(message: string): boolean {
  // Enquiries rarely contain several URLs; bulk link-dropping does.
  const linkCount = message.match(LINK_PATTERN)?.length ?? 0;
  if (linkCount >= 3) return true;

  if (SPAM_PHRASES.test(message)) return true;

  // Long messages typed entirely in caps are almost never genuine.
  if (message.length > 120) {
    const letters = message.replace(/[^a-z]/gi, '');
    if (letters.length > 40) {
      const upper = message.replace(/[^A-Z]/g, '').length;
      if (upper / letters.length > 0.85) return true;
    }
  }

  return false;
}

/** Generic message: never explain which heuristic tripped. */
function spamError(): AppError {
  return new AppError(
    ERROR_CODES.SPAM_REJECTED,
    'Your submission could not be processed. Please try again or contact us directly.',
  );
}
