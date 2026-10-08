import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { generateKeyPairSync, createSign, type KeyObject } from 'crypto';
import axios from 'axios';

vi.mock('axios');

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwkFor = (kid: string) => ({ ...publicKey.export({ format: 'jwk' }), kid });

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

const makeToken = (kid: string, { payload: payloadOverrides = {}, signingKey = privateKey }: {
  payload?: Record<string, unknown>;
  signingKey?: KeyObject;
} = {}) => {
  const header = { alg: 'RS256', typ: 'JWT', kid };
  const payload = {
    aud: 'bluedot-web-apps',
    iss: 'https://login.bluedot.org/realms/customers',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: 'user-1',
    email: 'someone@example.com',
    email_verified: true,
    ...payloadOverrides,
  };
  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(signingKey);
  return `${signingInput}.${signature.toString('base64url')}`;
};

// The JWKS cache is module state, so each test re-imports the module for an
// empty cache and full independence from test order.
const loadPreset = async () => (await import('./Login')).loginPresets.keycloak;

beforeEach(() => {
  vi.resetModules();
  vi.mocked(axios.get).mockReset();
});

test('caches JWKS keys across verifications instead of refetching per request', async () => {
  const preset = await loadPreset();
  vi.mocked(axios.get).mockResolvedValue({ data: { keys: [jwkFor('key-1')] } });

  await preset.verifyAndDecodeToken(makeToken('key-1'));
  await preset.verifyAndDecodeToken(makeToken('key-1'));

  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('refetches once for a token signed by a rotated key the cache predates', async () => {
  const preset = await loadPreset();
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { keys: [jwkFor('key-1')] } });
  await preset.verifyAndDecodeToken(makeToken('key-1'));

  vi.mocked(axios.get).mockResolvedValueOnce({ data: { keys: [jwkFor('key-2')] } });
  await expect(preset.verifyAndDecodeToken(makeToken('key-2'))).resolves.toMatchObject({ sub: 'user-1' });

  expect(axios.get).toHaveBeenCalledTimes(2);
});

test('does not refetch when freshly fetched keys lack the token kid', async () => {
  const preset = await loadPreset();
  vi.mocked(axios.get).mockResolvedValue({ data: { keys: [jwkFor('key-1')] } });

  await expect(preset.verifyAndDecodeToken(makeToken('unknown-key'))).rejects.toThrow('Public key not found');

  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('concurrent verifications on a cold cache share one JWKS fetch', async () => {
  const preset = await loadPreset();
  vi.mocked(axios.get).mockResolvedValue({ data: { keys: [jwkFor('key-1')] } });

  await Promise.all([
    preset.verifyAndDecodeToken(makeToken('key-1')),
    preset.verifyAndDecodeToken(makeToken('key-1')),
  ]);

  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('does not cache a failed JWKS fetch', async () => {
  const preset = await loadPreset();
  vi.mocked(axios.get).mockRejectedValueOnce(new Error('network down'));
  await expect(preset.verifyAndDecodeToken(makeToken('key-1'))).rejects.toThrow('network down');

  vi.mocked(axios.get).mockResolvedValueOnce({ data: { keys: [jwkFor('key-1')] } });
  await expect(preset.verifyAndDecodeToken(makeToken('key-1'))).resolves.toMatchObject({ sub: 'user-1' });

  expect(axios.get).toHaveBeenCalledTimes(2);
});

describe('rejection errors', () => {
  const loadLogin = () => import('./Login');
  const { privateKey: otherPrivateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({ data: { keys: [jwkFor('key-1')] } });
  });

  test.each([
    ['missing parts', 'not-a-jwt', 'Invalid token format'],
    ['wrong audience', makeToken('key-1', { payload: { aud: 'someone-else' } }), 'Invalid token audience'],
    ['wrong issuer', makeToken('key-1', { payload: { iss: 'https://evil.example.com' } }), 'Invalid token issuer'],
    ['expired', makeToken('key-1', { payload: { exp: Math.floor(Date.now() / 1000) - 60 } }), 'Token expired'],
    ['no matching signing key', makeToken('unknown-key'), 'Public key not found'],
    ['invalid signature', makeToken('key-1', { signingKey: otherPrivateKey }), 'Invalid signature'],
    ['missing sub', makeToken('key-1', { payload: { sub: undefined } }), 'Missing sub on payload'],
    ['missing email', makeToken('key-1', { payload: { email: undefined } }), 'Missing email on payload'],
    ['email_verified not a boolean', makeToken('key-1', { payload: { email_verified: 'true' } }), 'Expected email_verified to be a boolean'],
  ])('throws InvalidTokenError for %s', async (_, token, message) => {
    const { loginPresets, InvalidTokenError } = await loadLogin();

    const error = await loginPresets.keycloak.verifyAndDecodeToken(token).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(InvalidTokenError);
    expect((error as Error).message).toContain(message);
  });

  test('throws InvalidTokenError for a Google account outside bluedot.org', async () => {
    const { loginPresets, InvalidTokenError } = await loadLogin();
    const token = makeToken('key-1', {
      payload: {
        aud: loginPresets.googleBlueDot.oidcSettings.client_id, iss: 'https://accounts.google.com', hd: 'example.com',
      },
    });

    const error = await loginPresets.googleBlueDot.verifyAndDecodeToken(token).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(InvalidTokenError);
    expect((error as Error).message).toBe('Not a verified bluedot.org account');
  });

  test('propagates a signing-key fetch failure as something other than InvalidTokenError', async () => {
    const { loginPresets, InvalidTokenError } = await loadLogin();
    const networkError = Object.assign(new Error('getaddrinfo ENOTFOUND login.bluedot.org'), { code: 'ENOTFOUND' });
    vi.mocked(axios.get).mockRejectedValue(networkError);

    const error = await loginPresets.keycloak.verifyAndDecodeToken(makeToken('key-1')).catch((err: unknown) => err);

    expect(error).toBe(networkError);
    expect(error).not.toBeInstanceOf(InvalidTokenError);
  });
});
