import axios from 'axios';
import { createPublicKey, createVerify, type JsonWebKey } from 'crypto';

// Signing keys rotate rarely and issuers serve them with long cache headers,
// so refetching them on every authenticated request adds a needless network
// hop to every API call. Cache per issuer, refetching early only when a token
// arrives signed by a key we haven't seen (rotation mid-TTL). The TTL also
// bounds how long a key the issuer has removed keeps verifying tokens, so it
// is kept short. Caching the in-flight promise (not just the resolved keys)
// means concurrent requests on a cold or expired cache share one fetch; a
// failed fetch is evicted so it isn't cached for the TTL.
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;
const jwksCache = new Map<string, { keys: Promise<JsonWebKey[]>; fetchedAt: number }>();

const getJwks = (jwksUrl: string, forceRefresh = false): { keys: Promise<JsonWebKey[]>; fromCache: boolean } => {
  const cached = jwksCache.get(jwksUrl);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL_MS) {
    return { keys: cached.keys, fromCache: true };
  }

  const keys = axios.get<{ keys: JsonWebKey[] }>(jwksUrl).then((response) => response.data.keys);
  jwksCache.set(jwksUrl, { keys, fetchedAt: Date.now() });
  keys.catch(() => {
    if (jwksCache.get(jwksUrl)?.keys === keys) {
      jwksCache.delete(jwksUrl);
    }
  });

  return { keys, fromCache: false };
};

const verifyJwt = async (
  token: string,
  verifyConfig: { aud: string; iss: string; jwksUrl: string },
): Promise<{
  iss: string; aud: string; exp: number;
  sub: string; email: string; email_verified: boolean;
  [key: string]: unknown;
}> => {
  // Split the JWT into its parts
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid token format');
  }

  // Decode the header and payload
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

  // Both Keycloak and Google only issue RS256 tokens. Checking up front gives a
  // clear error instead of a signature failure for anything else.
  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported token algorithm: ${String(header.alg)}`);
  }

  // Verify aud (audience). Per RFC 7519 §4.1.3 `aud` may be a string or an array
  // of strings — Keycloak audience-mapper tokens often emit an array even with a
  // single entry — so accept the expected audience in either form.
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(verifyConfig.aud)) {
    throw new Error('Invalid token audience');
  }

  // Verify iss (issuer)
  if (payload.iss !== verifyConfig.iss) {
    throw new Error('Invalid token issuer');
  }

  // Verify exp (expiration time)
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  // Find key. Keys that came from the cache may predate a rotation, so an
  // unknown kid earns one refetch; keys we just fetched are current, so an
  // unknown kid there is simply not found.
  const { keys: keysPromise, fromCache } = getJwks(verifyConfig.jwksUrl);
  let keys = await keysPromise;
  let key = keys.find((k) => k.kid === header.kid);
  if (!key && fromCache) {
    keys = await getJwks(verifyConfig.jwksUrl, true).keys;
    key = keys.find((k) => k.kid === header.kid);
  }

  if (!key) {
    throw new Error('Public key not found');
  }

  if (key.kty !== 'RSA') {
    throw new Error(`Unsupported public key type: ${String(key.kty)}`);
  }

  const publicKey = createPublicKey({
    key: {
      kty: key.kty,
      n: key.n,
      e: key.e,
    },
    format: 'jwk',
  });

  // Verify signature
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, 'base64url');
  const verify = createVerify('RSA-SHA256').update(signatureInput);
  const isValid = verify.verify(publicKey, signature);
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  if (!payload.sub) {
    throw new Error('Missing sub on payload');
  }

  if (!payload.email) {
    throw new Error('Missing email on payload - ensure you included \'email\' in scope');
  }

  if (typeof payload.email_verified !== 'boolean') {
    throw new Error(`Expected email_verified to be a boolean on payload, but got ${typeof payload.email_verified}`);
  }

  return payload;
};

/** Verifies an id_token issued to `loginPresets.keycloak` (any customer login.bluedot.org account) */
export const verifyKeycloakToken = async (token: string) => {
  const payload = await verifyJwt(token, {
    aud: 'bluedot-web-apps',
    iss: 'https://login.bluedot.org/realms/customers',
    jwksUrl: 'https://login.bluedot.org/realms/customers/protocol/openid-connect/certs',
  });
  const name = typeof payload.name === 'string' ? payload.name.trim() : undefined;
  const firstName = typeof payload.given_name === 'string' ? payload.given_name.trim() : undefined;
  const lastName = typeof payload.family_name === 'string' ? payload.family_name.trim() : undefined;
  return {
    ...payload, ...(name && { name }), ...(firstName && { firstName }), ...(lastName && { lastName }),
  };
};

/** Verifies an id_token issued to `loginPresets.googleBlueDot` (only \@bluedot.org Google accounts) */
export const verifyGoogleBlueDotToken = async (token: string) => {
  const payload = await verifyJwt(token, {
    // The useless concat is to avoid GitHub's secret scanner complaining. This is NOT secret.
    // eslint-disable-next-line no-useless-concat
    aud: '558012313311-ndfttio1u55baojf' + 'odrhiju4nvkakmqj.apps.googleusercontent.com',
    iss: 'https://accounts.google.com',
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
  });

  if (payload.hd !== 'bluedot.org' || !payload.email_verified) {
    throw new Error('Not a verified bluedot.org account');
  }

  return payload as typeof payload & { hd: 'bluedot.org'; email_verified: true };
};
