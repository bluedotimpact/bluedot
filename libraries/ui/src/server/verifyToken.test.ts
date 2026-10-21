import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import axios from 'axios';
import { createSign, generateKeyPairSync } from 'crypto';

vi.mock('axios');

const KID = 'test-kid';
const KEYCLOAK_ISS = 'https://login.bluedot.org/realms/customers';
const KEYCLOAK_AUD = 'bluedot-web-apps';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwkFor = (kid: string) => ({ ...publicKey.export({ format: 'jwk' }), kid });

const b64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

const signToken = ({
  header = { alg: 'RS256', typ: 'JWT', kid: KID },
  payload = {},
}: {
  header?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} = {}) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iss: KEYCLOAK_ISS,
    aud: KEYCLOAK_AUD,
    exp: nowSeconds + 3600,
    sub: 'user-123',
    email: 'user@example.com',
    email_verified: true,
    ...payload,
  };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(fullPayload));
  const signature = createSign('RSA-SHA256').update(`${headerB64}.${payloadB64}`).sign(privateKey);
  return `${headerB64}.${payloadB64}.${b64url(signature)}`;
};

// The JWKS cache is module state, so each test re-imports the module for an
// empty cache and full independence from test order.
const loadVerifiers = async () => import('./verifyToken');
const loadVerifier = async () => (await loadVerifiers()).verifyKeycloakToken;

const mockJwks = (...kids: string[]) => {
  vi.mocked(axios.get).mockResolvedValue({ data: { keys: kids.map(jwkFor) } });
};

beforeEach(() => {
  vi.resetModules();
  vi.mocked(axios.get).mockReset();
});

describe('verifyKeycloakToken', () => {
  test('accepts a correctly signed token and returns the payload', async () => {
    const verify = await loadVerifier();
    mockJwks(KID);

    const payload = await verify(signToken({ payload: { name: ' Ada Lovelace ', given_name: 'Ada' } }));

    expect(payload).toMatchObject({
      sub: 'user-123',
      email: 'user@example.com',
      name: 'Ada Lovelace',
      firstName: 'Ada',
    });
    expect(axios.get).toHaveBeenCalledWith('https://login.bluedot.org/realms/customers/protocol/openid-connect/certs');
  });
});

describe('verifyGoogleBlueDotToken', () => {
  // eslint-disable-next-line no-useless-concat
  const GOOGLE_AUD = '558012313311-ndfttio1u55baojf' + 'odrhiju4nvkakmqj.apps.googleusercontent.com';
  const googleToken = (payload: Record<string, unknown> = {}) => signToken({
    payload: {
      iss: 'https://accounts.google.com', aud: GOOGLE_AUD, hd: 'bluedot.org', ...payload,
    },
  });

  test('accepts a verified bluedot.org account', async () => {
    const { verifyGoogleBlueDotToken } = await loadVerifiers();
    mockJwks(KID);

    await expect(verifyGoogleBlueDotToken(googleToken())).resolves.toMatchObject({ sub: 'user-123', hd: 'bluedot.org' });
    expect(axios.get).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v3/certs');
  });

  test('rejects an account outside bluedot.org', async () => {
    const { verifyGoogleBlueDotToken } = await loadVerifiers();
    mockJwks(KID);

    await expect(verifyGoogleBlueDotToken(googleToken({ hd: 'example.com' }))).rejects.toThrow('Not a verified bluedot.org account');
  });

  test('rejects a token with no hd claim', async () => {
    const { verifyGoogleBlueDotToken } = await loadVerifiers();
    mockJwks(KID);

    await expect(verifyGoogleBlueDotToken(googleToken({ hd: undefined }))).rejects.toThrow('Not a verified bluedot.org account');
  });

  test('rejects an unverified email', async () => {
    const { verifyGoogleBlueDotToken } = await loadVerifiers();
    mockJwks(KID);

    await expect(verifyGoogleBlueDotToken(googleToken({ email_verified: false }))).rejects.toThrow('Not a verified bluedot.org account');
  });
});

describe('JWKS cache', () => {
  const tokenFor = (kid: string) => signToken({ header: { alg: 'RS256', typ: 'JWT', kid } });

  test('caches JWKS keys across verifications instead of refetching per request', async () => {
    const verify = await loadVerifier();
    mockJwks('key-1');

    await verify(tokenFor('key-1'));
    await verify(tokenFor('key-1'));

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('refetches once for a token signed by a rotated key the cache predates', async () => {
    const verify = await loadVerifier();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { keys: [jwkFor('key-1')] } });
    await verify(tokenFor('key-1'));

    vi.mocked(axios.get).mockResolvedValueOnce({ data: { keys: [jwkFor('key-2')] } });
    await expect(verify(tokenFor('key-2'))).resolves.toMatchObject({ sub: 'user-123' });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test('does not refetch when freshly fetched keys lack the token kid', async () => {
    const verify = await loadVerifier();
    mockJwks('key-1');

    await expect(verify(tokenFor('unknown-key'))).rejects.toThrow('Public key not found');

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('concurrent verifications on a cold cache share one JWKS fetch', async () => {
    const verify = await loadVerifier();
    mockJwks('key-1');

    await Promise.all([verify(tokenFor('key-1')), verify(tokenFor('key-1'))]);

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('does not cache a failed JWKS fetch', async () => {
    const verify = await loadVerifier();
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('network down'));
    await expect(verify(tokenFor('key-1'))).rejects.toThrow('network down');

    vi.mocked(axios.get).mockResolvedValueOnce({ data: { keys: [jwkFor('key-1')] } });
    await expect(verify(tokenFor('key-1'))).resolves.toMatchObject({ sub: 'user-123' });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});

describe('rejection errors', () => {
  const withSignatureOf = (token: string, other: string) => `${token.split('.').slice(0, 2).join('.')}.${other.split('.')[2]}`;

  test.each([
    ['missing parts', 'not-a-jwt', 'Invalid token format'],
    ['not RS256', signToken({ header: { alg: 'HS256', typ: 'JWT', kid: KID } }), 'Unsupported token algorithm'],
    ['wrong audience', signToken({ payload: { aud: 'someone-else' } }), 'Invalid token audience'],
    ['wrong issuer', signToken({ payload: { iss: 'https://evil.example.com' } }), 'Invalid token issuer'],
    ['expired', signToken({ payload: { exp: Math.floor(Date.now() / 1000) - 60 } }), 'Token expired'],
    ['no matching signing key', signToken({ header: { alg: 'RS256', typ: 'JWT', kid: 'unknown-key' } }), 'Public key not found'],
    ['invalid signature', withSignatureOf(signToken(), signToken({ payload: { sub: 'someone-else' } })), 'Invalid signature'],
    ['missing sub', signToken({ payload: { sub: undefined } }), 'Missing sub on payload'],
    ['missing email', signToken({ payload: { email: undefined } }), 'Missing email on payload'],
    ['email_verified not a boolean', signToken({ payload: { email_verified: 'true' } }), 'Expected email_verified to be a boolean'],
  ])('throws InvalidTokenError for %s', async (_, token, message) => {
    const verify = await loadVerifier();
    const { InvalidTokenError } = await import('../utils/InvalidTokenError');
    mockJwks(KID);

    const error = await verify(token).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(InvalidTokenError);
    expect((error as Error).message).toContain(message);
  });

  test('throws InvalidTokenError for a non-RSA signing key', async () => {
    const verify = await loadVerifier();
    const { InvalidTokenError } = await import('../utils/InvalidTokenError');
    vi.mocked(axios.get).mockResolvedValue({ data: { keys: [{ kid: KID, kty: 'EC' }] } });

    const error = await verify(signToken()).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(InvalidTokenError);
    expect((error as Error).message).toContain('Unsupported public key type: EC');
  });

  test('propagates a signing-key fetch failure as something other than InvalidTokenError', async () => {
    const verify = await loadVerifier();
    const { InvalidTokenError } = await import('../utils/InvalidTokenError');
    const networkError = Object.assign(new Error('getaddrinfo ENOTFOUND login.bluedot.org'), { code: 'ENOTFOUND' });
    vi.mocked(axios.get).mockRejectedValue(networkError);

    const error = await verify(signToken()).catch((err: unknown) => err);

    expect(error).toBe(networkError);
    expect(error).not.toBeInstanceOf(InvalidTokenError);
  });
});
