import {
  expect, test, vi,
} from 'vitest';
import { generateKeyPairSync, createSign } from 'crypto';
import axios from 'axios';
import { loginPresets } from './Login';

vi.mock('axios');

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key' };

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

const makeToken = (kid: string) => {
  const header = { alg: 'RS256', typ: 'JWT', kid };
  const payload = {
    aud: 'bluedot-web-apps',
    iss: 'https://login.bluedot.org/realms/customers',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: 'user-1',
    email: 'someone@example.com',
    email_verified: true,
  };
  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
};

test('caches JWKS keys across verifications instead of refetching per request', async () => {
  vi.mocked(axios.get).mockResolvedValue({ data: { keys: [jwk] } });

  await loginPresets.keycloak.verifyAndDecodeToken(makeToken('test-key'));
  await loginPresets.keycloak.verifyAndDecodeToken(makeToken('test-key'));

  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('refetches JWKS once when a token is signed by an unseen key', async () => {
  vi.mocked(axios.get).mockResolvedValue({ data: { keys: [jwk] } });
  vi.mocked(axios.get).mockClear();

  await expect(loginPresets.keycloak.verifyAndDecodeToken(makeToken('rotated-key'))).rejects.toThrow('Public key not found');

  expect(axios.get).toHaveBeenCalledTimes(1);
});
