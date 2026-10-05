import {
  beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import axios from 'axios';
import { createSign, generateKeyPairSync, type KeyObject } from 'crypto';
import { verifyKeycloakToken } from './verifyToken';

vi.mock('axios');

const KID = 'test-kid';
const KEYCLOAK_ISS = 'https://login.bluedot.org/realms/customers';
const KEYCLOAK_AUD = 'bluedot-web-apps';

let privateKey: KeyObject;

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

beforeAll(() => {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  privateKey = pair.privateKey;
  const jwk = pair.publicKey.export({ format: 'jwk' });
  vi.mocked(axios.get).mockResolvedValue({
    data: {
      keys: [{
        ...jwk, kid: KID, alg: 'RS256', use: 'sig',
      }],
    },
  });
});

beforeEach(() => {
  vi.mocked(axios.get).mockClear();
});

describe('verifyKeycloakToken', () => {
  test('accepts a correctly signed token and returns the payload', async () => {
    const payload = await verifyKeycloakToken(signToken({ payload: { name: ' Ada Lovelace ', given_name: 'Ada' } }));

    expect(payload).toMatchObject({
      sub: 'user-123',
      email: 'user@example.com',
      name: 'Ada Lovelace',
      firstName: 'Ada',
    });
    expect(axios.get).toHaveBeenCalledWith('https://login.bluedot.org/realms/customers/protocol/openid-connect/certs');
  });

  test('rejects a token whose payload was tampered with after signing', async () => {
    const [headerB64, , signatureB64] = signToken().split('.');
    const tamperedPayloadB64 = b64url(JSON.stringify({
      iss: KEYCLOAK_ISS,
      aud: KEYCLOAK_AUD,
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'attacker',
      email: 'attacker@example.com',
      email_verified: true,
    }));

    await expect(verifyKeycloakToken(`${headerB64}.${tamperedPayloadB64}.${signatureB64}`))
      .rejects.toThrow('Invalid signature');
  });

  test('rejects an expired token', async () => {
    const token = signToken({ payload: { exp: Math.floor(Date.now() / 1000) - 60 } });

    await expect(verifyKeycloakToken(token)).rejects.toThrow('Token expired');
  });

  test('rejects a token that is not RS256', async () => {
    const token = signToken({ header: { alg: 'HS256', typ: 'JWT', kid: KID } });

    await expect(verifyKeycloakToken(token)).rejects.toThrow('Unsupported token algorithm: HS256');
  });
});
