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
const loadVerifier = async () => (await import('./verifyToken')).verifyKeycloakToken;

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

  test('rejects a token whose payload was tampered with after signing', async () => {
    const verify = await loadVerifier();
    mockJwks(KID);
    const [headerB64, , signatureB64] = signToken().split('.');
    const tamperedPayloadB64 = b64url(JSON.stringify({
      iss: KEYCLOAK_ISS,
      aud: KEYCLOAK_AUD,
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'attacker',
      email: 'attacker@example.com',
      email_verified: true,
    }));

    await expect(verify(`${headerB64}.${tamperedPayloadB64}.${signatureB64}`)).rejects.toThrow('Invalid signature');
  });

  test('rejects an expired token', async () => {
    const verify = await loadVerifier();
    mockJwks(KID);

    await expect(verify(signToken({ payload: { exp: Math.floor(Date.now() / 1000) - 60 } }))).rejects.toThrow('Token expired');
  });

  test('rejects a token that is not RS256', async () => {
    const verify = await loadVerifier();
    mockJwks(KID);

    await expect(verify(signToken({ header: { alg: 'HS256', typ: 'JWT', kid: KID } }))).rejects.toThrow('Unsupported token algorithm: HS256');
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
