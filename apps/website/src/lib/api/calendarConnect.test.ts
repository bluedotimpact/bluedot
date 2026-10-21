import { createHmac } from 'crypto';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import {
  createOAuthState, decryptRefreshToken, encryptRefreshToken, InvalidOAuthStateError, secretsMatch, stateCookie,
  verifyConnectToken, verifyOAuthState,
} from './calendarConnect';
import env from './env';

vi.mock('./env', () => ({
  default: {
    // "0123456789abcdef0123456789abcdef", 32 bytes
    CALENDAR_CONNECT_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
  },
}));

const mutableEnv = env as { CALENDAR_CONNECT_ENCRYPTION_KEY?: string };

afterEach(() => {
  vi.useRealTimers();
  mutableEnv.CALENDAR_CONNECT_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
});

describe('verifyConnectToken', () => {
  // The fixed vector from bluedotimpact/dot-to-dot src/link.test.ts: signed at 2026-10-19T15:00:00Z, valid for 14 days.
  const VECTOR = 'eyJzbGFja1VzZXJJZCI6IlUwQkFTUVJNMEgyIiwiZXhwIjoxNzkzNjMxNjAwfQ.gabhH5XDv7HFecF9TNf3n9uWychdt-swSFaS5Gv8wm4';
  const SIGNED_AT_MS = Date.parse('2026-10-19T15:00:00Z');

  test('accepts the Dot-to-Dot test vector', () => {
    expect(verifyConnectToken({ token: VECTOR, secret: 'shared-secret', nowMs: SIGNED_AT_MS }))
      .toEqual({ slackUserId: 'U0BASQRM0H2', exp: 1793631600 });
  });

  test('rejects it once it has expired', () => {
    expect(verifyConnectToken({ token: VECTOR, secret: 'shared-secret', nowMs: 1793631600 * 1000 })).toBeNull();
  });

  test('rejects the wrong secret, a changed payload, and malformed tokens', () => {
    expect(verifyConnectToken({ token: VECTOR, secret: 'other-secret', nowMs: SIGNED_AT_MS })).toBeNull();

    const [, signature] = VECTOR.split('.');
    const forgedData = Buffer.from(JSON.stringify({ slackUserId: 'UATTACKER', exp: 1793631600 })).toString('base64url');
    expect(verifyConnectToken({ token: `${forgedData}.${signature}`, secret: 'shared-secret', nowMs: SIGNED_AT_MS })).toBeNull();

    for (const token of ['', 'abc', `${VECTOR}.extra`, `.${signature}`]) {
      expect(verifyConnectToken({ token, secret: 'shared-secret', nowMs: SIGNED_AT_MS })).toBeNull();
    }
  });

  test('rejects a correctly signed payload with the wrong shape', () => {
    const data = Buffer.from(JSON.stringify({ slackUserId: 42, exp: 'never' })).toString('base64url');
    const signature = createHmac('sha256', 'shared-secret').update(data).digest('base64url');
    expect(verifyConnectToken({ token: `${data}.${signature}`, secret: 'shared-secret', nowMs: SIGNED_AT_MS })).toBeNull();
  });
});

describe('refresh token encryption', () => {
  test('round-trips, with a fresh IV each time', () => {
    const a = encryptRefreshToken('1//refresh-token');
    const b = encryptRefreshToken('1//refresh-token');
    expect(a).not.toEqual(b);
    expect(a).not.toContain('refresh-token');
    expect(a.startsWith('v1.')).toBe(true);
    expect(decryptRefreshToken(a)).toBe('1//refresh-token');
    expect(decryptRefreshToken(b)).toBe('1//refresh-token');
  });

  test('rejects tampered ciphertext', () => {
    const [version, iv, tag, ciphertext] = encryptRefreshToken('1//refresh-token').split('.');
    const flipped = Buffer.from(ciphertext!, 'base64url');
    flipped[0] = (flipped[0]! + 1) % 256;
    expect(() => decryptRefreshToken([version, iv, tag, flipped.toString('base64url')].join('.'))).toThrow();
  });

  test('rejects a different key', () => {
    const encrypted = encryptRefreshToken('1//refresh-token');
    mutableEnv.CALENDAR_CONNECT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    expect(() => decryptRefreshToken(encrypted)).toThrow();
  });

  test('refuses a key that is not 32 bytes', () => {
    mutableEnv.CALENDAR_CONNECT_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64');
    expect(() => encryptRefreshToken('x')).toThrow(/32 bytes/);
  });
});

describe('OAuth state', () => {
  const STATE = {
    userId: 'rec-user', slackUserId: 'U1', timeZone: 'Europe/London', nonce: 'nonce-abc', connectToken: 'tok',
  };

  test('round-trips when the cookie nonce matches', async () => {
    const state = await createOAuthState(STATE);
    expect(state).not.toContain('rec-user');
    await expect(verifyOAuthState({ state, cookieNonce: 'nonce-abc' })).resolves.toEqual(STATE);
  });

  test('rejects a missing or different cookie, so a link started in another browser fails', async () => {
    const state = await createOAuthState(STATE);
    await expect(verifyOAuthState({ state, cookieNonce: undefined })).rejects.toThrow(InvalidOAuthStateError);
    await expect(verifyOAuthState({ state, cookieNonce: 'nonce-xyz' })).rejects.toThrow('browser mismatch');
  });

  test('rejects garbage and expired state', async () => {
    await expect(verifyOAuthState({ state: 'garbage', cookieNonce: 'nonce-abc' })).rejects.toThrow('invalid');

    vi.useFakeTimers({ now: Date.parse('2026-10-15T12:00:00Z') });
    const state = await createOAuthState(STATE);
    vi.setSystemTime(Date.parse('2026-10-15T12:11:00Z'));
    await expect(verifyOAuthState({ state, cookieNonce: 'nonce-abc' })).rejects.toThrow('expired');
  });
});

test('secretsMatch compares regardless of length', () => {
  expect(secretsMatch('abc', 'abc')).toBe(true);
  expect(secretsMatch('abc', 'abcd')).toBe(false);
  expect(secretsMatch('', 'abc')).toBe(false);
});

test('the state cookie is httpOnly, Lax and scoped to the callback', () => {
  const cookie = stateCookie({ nonce: 'n' });
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  expect(cookie).toContain('Path=/api/calendar-connections/google/callback');
});
