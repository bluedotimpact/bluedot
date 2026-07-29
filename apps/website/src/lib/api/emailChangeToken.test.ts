import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { createHash } from 'crypto';
import { SignJWT } from 'jose';
import { createEmailChangeToken, verifyEmailChangeToken } from './emailChangeToken';
import env from './env';

vi.mock('./env', () => ({
  default: { EMAIL_CHANGE_TOKEN_SECRET: 'test-secret' },
}));

const mutableEnv = env as { EMAIL_CHANGE_TOKEN_SECRET?: string };

const mintToken = () => createEmailChangeToken({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' });

describe('emailChangeToken', () => {
  afterEach(() => {
    mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'test-secret';
    vi.useRealTimers();
  });

  test('round-trips a payload, normalising emails', async () => {
    const payload = await verifyEmailChangeToken(await createEmailChangeToken({ userId: 'u1', oldEmail: ' Old@Example.com ', newEmail: 'New@Example.com' }));

    expect(payload).toEqual({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
  });

  test('does not expose the payload in the token', async () => {
    const token = await mintToken();

    for (const part of token.split('.')) {
      expect(Buffer.from(part, 'base64url').toString()).not.toContain('example.com');
    }
  });

  test('rejects a tampered ciphertext', async () => {
    const parts = (await mintToken()).split('.');
    parts[3] = parts[3]!.startsWith('A') ? `B${parts[3]!.slice(1)}` : `A${parts[3]!.slice(1)}`;

    await expect(verifyEmailChangeToken(parts.join('.'))).rejects.toThrowError('This link is invalid');
  });

  test('rejects a tampered auth tag', async () => {
    const parts = (await mintToken()).split('.');
    parts[4] = parts[4]!.startsWith('A') ? `B${parts[4]!.slice(1)}` : `A${parts[4]!.slice(1)}`;

    await expect(verifyEmailChangeToken(parts.join('.'))).rejects.toThrowError('This link is invalid');
  });

  test('rejects a signed but unencrypted token', async () => {
    const signed = await new SignJWT({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'attacker@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('48h')
      .sign(createHash('sha256').update('test-secret').digest());

    await expect(verifyEmailChangeToken(signed)).rejects.toThrowError('This link is invalid');
  });

  test('rejects malformed tokens', async () => {
    await expect(verifyEmailChangeToken('not-a-token')).rejects.toThrowError('This link is invalid');
    await expect(verifyEmailChangeToken('')).rejects.toThrowError('This link is invalid');
  });

  test('rejects an unsigned alg-none token', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      userId: 'u1', oldEmail: 'old@example.com', newEmail: 'attacker@example.com', exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString('base64url');

    await expect(verifyEmailChangeToken(`${header}.${payload}.`)).rejects.toThrowError('This link is invalid');
  });

  test('rejects an expired token', async () => {
    vi.useFakeTimers();
    const token = await mintToken();
    vi.advanceTimersByTime(48 * 60 * 60 * 1000 + 1000);

    await expect(verifyEmailChangeToken(token)).rejects.toThrowError('This link has expired');
  });

  test('accepts a token just before it expires', async () => {
    vi.useFakeTimers();
    const token = await mintToken();
    vi.advanceTimersByTime(47 * 60 * 60 * 1000);

    expect((await verifyEmailChangeToken(token)).userId).toBe('u1');
  });

  test('rejects a token minted with a different secret', async () => {
    const token = await mintToken();
    mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'other-secret';

    await expect(verifyEmailChangeToken(token)).rejects.toThrowError('This link is invalid');
  });

  test('throws when the secret is not configured', async () => {
    mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = undefined;

    await expect(mintToken()).rejects.toThrowError('not configured');
    await expect(verifyEmailChangeToken('a.b.c')).rejects.toThrowError('not configured');
  });
});
