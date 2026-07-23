import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { createEmailChangeToken, verifyEmailChangeToken } from './emailChangeToken';
import env from './env';

vi.mock('./env', () => ({
  default: {
    EMAIL_CHANGE_TOKEN_SECRET: 'test-secret',
  },
}));

const mutableEnv = env as { EMAIL_CHANGE_TOKEN_SECRET?: string };

describe('emailChangeToken', () => {
  afterEach(() => {
    mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'test-secret';
    vi.useRealTimers();
  });

  test('round-trips a payload, normalising emails', () => {
    const token = createEmailChangeToken({ userId: 'u1', oldEmail: ' Old@Example.com ', newEmail: 'New@Example.com' });
    const payload = verifyEmailChangeToken(token);

    expect(payload.userId).toBe('u1');
    expect(payload.oldEmail).toBe('old@example.com');
    expect(payload.newEmail).toBe('new@example.com');
    expect(payload.exp).toBeGreaterThan(Date.now());
  });

  test('rejects a tampered payload', () => {
    const token = createEmailChangeToken({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
    const [encodedPayload, signature] = token.split('.') as [string, string];
    const tampered = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as Record<string, unknown>;
    tampered.newEmail = 'attacker@example.com';
    const tamperedToken = `${Buffer.from(JSON.stringify(tampered)).toString('base64url')}.${signature}`;

    expect(() => verifyEmailChangeToken(tamperedToken)).toThrowError('This link is invalid');
  });

  test('rejects a tampered signature', () => {
    const token = createEmailChangeToken({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
    const [encodedPayload] = token.split('.') as [string];

    expect(() => verifyEmailChangeToken(`${encodedPayload}.${Buffer.from('bad-signature').toString('base64url')}`)).toThrowError('This link is invalid');
  });

  test('rejects malformed tokens', () => {
    expect(() => verifyEmailChangeToken('not-a-token')).toThrowError('This link is invalid');
    expect(() => verifyEmailChangeToken('')).toThrowError('This link is invalid');
  });

  test('rejects an expired token', () => {
    vi.useFakeTimers();
    const token = createEmailChangeToken({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
    vi.advanceTimersByTime(48 * 60 * 60 * 1000 + 1000);

    expect(() => verifyEmailChangeToken(token)).toThrowError('This link has expired');
  });

  test('rejects a token minted with a different secret', () => {
    const token = createEmailChangeToken({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
    mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'other-secret';

    expect(() => verifyEmailChangeToken(token)).toThrowError('This link is invalid');
  });

  test('throws when the secret is not configured', () => {
    mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = undefined;

    expect(() => createEmailChangeToken({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })).toThrowError('not configured');
    expect(() => verifyEmailChangeToken('a.b')).toThrowError('not configured');
  });
});
