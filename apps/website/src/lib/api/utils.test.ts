import { describe, expect, test } from 'vitest';
import env from './env';
import { verifyPublicToken } from './utils';

const TEST_TOKEN = 'test-token-secret';

describe('verifyPublicToken', () => {
  test('accepts the configured token', () => {
    expect(() => verifyPublicToken(TEST_TOKEN)).not.toThrow();
  });

  test('throws UNAUTHORIZED when the token is the wrong length', () => {
    expect(() => verifyPublicToken('wrong')).toThrow('Invalid token');
  });

  test('throws UNAUTHORIZED for a same-length but different token', () => {
    expect(() => verifyPublicToken('X'.repeat(TEST_TOKEN.length))).toThrow('Invalid token');
  });

  test('throws INTERNAL_SERVER_ERROR when the token is not configured', () => {
    const mutableEnv = env as { CERTIFICATE_CREATION_TOKEN?: string };
    mutableEnv.CERTIFICATE_CREATION_TOKEN = undefined;
    try {
      expect(() => verifyPublicToken(TEST_TOKEN)).toThrow('Public token not configured');
    } finally {
      mutableEnv.CERTIFICATE_CREATION_TOKEN = TEST_TOKEN;
    }
  });
});
