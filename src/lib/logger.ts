/**
 * Structured logger.
 *
 * Two rules from the security requirements are enforced here rather than left
 * to call sites:
 *  1. Sensitive keys are redacted before anything is written.
 *  2. Production emits single-line JSON so a log shipper can parse it.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|authorization|cookie|apikey|api_key|privatekey|private_key|credential|session|otp|pin|cvv)/i;

const REDACTED = '[redacted]';
const MAX_DEPTH = 4;

function redact(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth >= MAX_DEPTH) return '[truncated]';

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redact(item, depth + 1));
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(val, depth + 1);
    }
    return out;
  }

  return value;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): number {
  if (process.env.NODE_ENV === 'test') return LEVEL_WEIGHT.error;
  if (process.env.NODE_ENV === 'production') return LEVEL_WEIGHT.info;
  return LEVEL_WEIGHT.debug;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < minLevel()) return;

  const safeMeta = meta ? (redact(meta) as Record<string, unknown>) : undefined;

  if (process.env.NODE_ENV === 'production') {
    const line = JSON.stringify({
      level,
      time: new Date().toISOString(),
      message,
      ...safeMeta,
    });
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  const prefix = `[${level.toUpperCase()}]`;
  if (level === 'error') console.error(prefix, message, safeMeta ?? '');
  else if (level === 'warn') console.warn(prefix, message, safeMeta ?? '');
  else console.log(prefix, message, safeMeta ?? '');
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    write('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    write('error', message, meta),
};

/** Exposed for unit tests of the redaction rules. */
export const __testing = { redact };
