/**
 * Application error taxonomy.
 *
 * Every error crossing the API boundary becomes an `AppError` so that the
 * response shape, HTTP status, and log severity are decided in one place —
 * and so raw driver/SDK messages never leak to a client.
 */

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SPAM_REJECTED: 'SPAM_REJECTED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNSUPPORTED_MEDIA: 'UNSUPPORTED_MEDIA',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SPAM_REJECTED: 400,
  ACCOUNT_SUSPENDED: 403,
  UNSUPPORTED_MEDIA: 415,
  PAYLOAD_TOO_LARGE: 413,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

/** Field-level validation detail, keyed by dotted field path. */
export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: FieldErrors;
  /** Extra context for logs only — never serialized into a response. */
  readonly context?: Record<string, unknown>;
  /** Expected errors (401/404/422) are logged at a lower severity. */
  readonly expected: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      fields?: FieldErrors;
      context?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fields = options.fields;
    this.context = options.context;
    this.expected = this.status < 500;
    Error.captureStackTrace?.(this, AppError);
  }
}

// Constructors for the cases used across the codebase, so call sites stay short.

export const validationError = (message = 'Invalid request', fields?: FieldErrors) =>
  new AppError(ERROR_CODES.VALIDATION_ERROR, message, { fields });

export const unauthenticated = (message = 'Authentication required') =>
  new AppError(ERROR_CODES.UNAUTHENTICATED, message);

export const forbidden = (message = 'You do not have permission to do that') =>
  new AppError(ERROR_CODES.FORBIDDEN, message);

export const notFound = (resource = 'Resource') =>
  new AppError(ERROR_CODES.NOT_FOUND, `${resource} not found`);

export const conflict = (message: string, fields?: FieldErrors) =>
  new AppError(ERROR_CODES.CONFLICT, message, { fields });

export const rateLimited = (message = 'Too many requests. Please try again shortly.') =>
  new AppError(ERROR_CODES.RATE_LIMITED, message);

export const accountSuspended = (
  message = 'This account has been suspended. Please contact support.',
) => new AppError(ERROR_CODES.ACCOUNT_SUSPENDED, message);

export const internalError = (message = 'Something went wrong', cause?: unknown) =>
  new AppError(ERROR_CODES.INTERNAL_ERROR, message, { cause });

export const serviceUnavailable = (message = 'Service temporarily unavailable') =>
  new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, message);

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
