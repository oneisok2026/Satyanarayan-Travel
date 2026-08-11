import { describe, expect, it } from 'vitest';
import { sanitizeQueryInput, escapeRegex } from '@/lib/security/sanitize';
import { safeFilename, uploadBaseName } from '@/lib/security/upload';
import { __testing } from '@/lib/logger';
import { updateProfileSchema } from '@/lib/validation/auth.schema';
import { createBookingSchema } from '@/lib/validation/booking.schema';

describe('sanitizeQueryInput', () => {
  it('strips MongoDB operators from untrusted input', () => {
    // Without this, { $ne: null } matches every document.
    const result = sanitizeQueryInput({ email: { $ne: null }, name: 'ok' });
    expect(result).toEqual({ email: {}, name: 'ok' });
  });

  it('strips dotted paths that could reach nested fields', () => {
    const result = sanitizeQueryInput({ 'profile.role': 'admin', city: 'Kolkata' });
    expect(result).toEqual({ city: 'Kolkata' });
  });

  it('leaves ordinary values untouched', () => {
    const input = { name: 'Sourav', age: 30, active: true };
    expect(sanitizeQueryInput(input)).toEqual(input);
  });
});

describe('escapeRegex', () => {
  it('neutralises regex metacharacters', () => {
    expect(escapeRegex('.*')).toBe('\\.\\*');
    // A user searching ".*" must not match everything.
    expect(new RegExp(escapeRegex('.*')).test('anything')).toBe(false);
    expect(new RegExp(escapeRegex('.*')).test('a.*b')).toBe(true);
  });
});

describe('safeFilename', () => {
  it('defuses path traversal', () => {
    const result = safeFilename('../../etc/passwd');
    expect(result).not.toContain('/');
    expect(result).not.toContain('..');
  });

  it('prevents dotfile creation', () => {
    expect(safeFilename('.htaccess').startsWith('.')).toBe(false);
  });

  it('keeps a normal filename readable', () => {
    expect(safeFilename('goa-beach-2026.jpg')).toBe('goa-beach-2026.jpg');
  });

  it('never returns an empty name', () => {
    expect(safeFilename('...')).toBe('file');
  });
});

describe('upload object naming', () => {
  const baseNameFor = uploadBaseName;

  it('drops the client extension so the detected type decides it', () => {
    // A double extension must not survive into the stored object name.
    expect(baseNameFor('photo.jpg.svg')).toBe('photo.jpg');
    expect(baseNameFor('cover.png')).toBe('cover');
  });

  it('cannot escape its folder', () => {
    const name = baseNameFor('../../../secrets.png');
    expect(name).not.toContain('/');
    expect(name).not.toContain('..');
  });

  it('always yields a usable name', () => {
    expect(baseNameFor('.png')).toBe('image');
    expect(baseNameFor('')).toBe('image');
  });
});

describe('upload folder allowlist', () => {
  it('accepts only the declared folders', async () => {
    const { UPLOAD_FOLDERS } = await import('@/constants');

    expect(UPLOAD_FOLDERS.includes('packages' as never)).toBe(true);
    // The folder becomes part of the object path, so anything crafted is
    // rejected outright rather than sanitized into something plausible.
    expect(UPLOAD_FOLDERS.includes('../../etc' as never)).toBe(false);
    expect(UPLOAD_FOLDERS.includes('' as never)).toBe(false);
  });
});

describe('logger redaction', () => {
  it('redacts credential-shaped keys', () => {
    const result = __testing.redact({
      email: 'user@example.com',
      password: 'hunter2',
      idToken: 'eyJhbGciOi',
      apiKey: 'AIza-secret',
    }) as Record<string, unknown>;

    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('[redacted]');
    expect(result.idToken).toBe('[redacted]');
    expect(result.apiKey).toBe('[redacted]');
  });

  it('redacts nested secrets', () => {
    const result = __testing.redact({
      user: { name: 'Sourav', sessionCookie: 'abc123' },
    }) as { user: Record<string, unknown> };

    expect(result.user.name).toBe('Sourav');
    expect(result.user.sessionCookie).toBe('[redacted]');
  });
});

describe('privilege escalation guards', () => {
  it('rejects a role field on profile update', () => {
    // .strict() must reject, not silently ignore — a customer cannot self-promote.
    const result = updateProfileSchema.safeParse({ name: 'Sourav', role: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rejects a status field on profile update', () => {
    const result = updateProfileSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(false);
  });

  it('accepts a legitimate profile update', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Sourav Chowdhury',
      phone: '+91 98765 43210',
    });
    expect(result.success).toBe(true);
  });
});

describe('booking schema', () => {
  it('ignores client-supplied pricing', () => {
    const parsed = createBookingSchema.parse({
      packageId: 'a'.repeat(24),
      travelDate: '2027-01-15',
      travellers: [{ name: 'Sourav Chowdhury', age: 30 }],
      contact: {
        name: 'Sourav Chowdhury',
        email: 'test@example.com',
        phone: '+919876543210',
      },
      // A tampered payload trying to set its own total.
      total: 1,
      price: 1,
    });

    expect(parsed).not.toHaveProperty('total');
    expect(parsed).not.toHaveProperty('price');
  });

  it('requires at least one traveller', () => {
    const result = createBookingSchema.safeParse({
      packageId: 'a'.repeat(24),
      travelDate: '2027-01-15',
      travellers: [],
      contact: { name: 'Test User', email: 'a@b.com', phone: '+919876543210' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed package id', () => {
    const result = createBookingSchema.safeParse({
      packageId: 'not-an-objectid',
      travelDate: '2027-01-15',
      travellers: [{ name: 'Test User', age: 30 }],
      contact: { name: 'Test User', email: 'a@b.com', phone: '+919876543210' },
    });
    expect(result.success).toBe(false);
  });
});
