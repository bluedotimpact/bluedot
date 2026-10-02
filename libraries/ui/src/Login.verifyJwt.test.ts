import {
  beforeEach, expect, test, vi,
} from 'vitest';
import { generateKeyPairSync, createSign } from 'crypto';
import axios from 'axios';

vi.mock('axios');

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwkFor = (kid: string) => ({ ...publicKey.export({ format: 'jwk' }), kid });

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
