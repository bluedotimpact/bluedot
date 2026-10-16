// Calendar Connect: members connect a calendar so we can schedule their 1-1 chats at times they're free.
// Only free/busy is ever read. Refresh tokens are encrypted before they reach the database and never leave the server.

import {
  createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual,
} from 'crypto';
import createHttpError from 'http-errors';
import { EncryptJWT, errors, jwtDecrypt } from 'jose';
import env from './env';

export const GOOGLE_FREEBUSY_SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy';
export const GOOGLE_SCOPES = ['openid', 'email', GOOGLE_FREEBUSY_SCOPE];

export const CALENDARS_PAGE_PATH = '/account/calendars';
export const GOOGLE_CALLBACK_PATH = '/api/calendar-connections/google/callback';

// Binds the OAuth round trip to the browser that started it. Scoped to the callback path so it's sent nowhere else.
export const STATE_COOKIE_NAME = 'calendar_connect_state';
const STATE_TTL_SECONDS = 10 * 60;

const ENCRYPTED_TOKEN_VERSION = 'v1';

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org').replace(/\/$/, '');
}

export function getGoogleRedirectUri(): string {
  return `${getSiteUrl()}${GOOGLE_CALLBACK_PATH}`;
}

function requireEnv(name: 'CALENDAR_CONNECT_LINK_SECRET' | 'CALENDAR_CONNECT_ENCRYPTION_KEY' | 'GOOGLE_CALENDAR_CLIENT_ID' | 'GOOGLE_CALENDAR_CLIENT_SECRET' | 'CALENDAR_CONNECT_BUSY_API_SECRET'): string {
  const value = env[name];
  if (!value) {
    throw new createHttpError.InternalServerError(`Calendar Connect is not configured: ${name} is missing`);
  }

  return value;
}

/** Constant-time string comparison that doesn't leak the length of the secret. */
export function secretsMatch(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

// Connect-link token, signed by Dot-to-Dot (src/link.ts in bluedotimpact/dot-to-dot). Keep the two in step:
//   base64url(JSON {"slackUserId", "exp": unixSeconds}) + "." + base64url(HMAC-SHA256(secret, first part))
export type ConnectLinkPayload = { slackUserId: string; exp: number };

export function verifyConnectToken({ token, secret, nowMs }: { token: string; secret: string; nowMs: number }): ConnectLinkPayload | null {
  const [data, signature, ...rest] = token.split('.');
  if (!data || !signature || rest.length > 0) return null;

  // Compares the base64url text of the two signatures, which is equivalent to comparing the raw HMACs
  const expected = Buffer.from(createHmac('sha256', secret).update(data).digest('base64url'));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as Partial<ConnectLinkPayload>;
    if (typeof payload.slackUserId !== 'string' || !payload.slackUserId || typeof payload.exp !== 'number') return null;
    if (payload.exp <= nowMs / 1000) return null;
    return { slackUserId: payload.slackUserId, exp: payload.exp };
  } catch {
    return null;
  }
}

export function verifyConnectTokenFromEnv(token: string): ConnectLinkPayload | null {
  return verifyConnectToken({ token, secret: requireEnv('CALENDAR_CONNECT_LINK_SECRET'), nowMs: Date.now() });
}

function getEncryptionKey(): Buffer {
  const key = Buffer.from(requireEnv('CALENDAR_CONNECT_ENCRYPTION_KEY'), 'base64');
  if (key.length !== 32) {
    throw new createHttpError.InternalServerError('Calendar Connect is not configured: CALENDAR_CONNECT_ENCRYPTION_KEY must be 32 bytes, base64-encoded');
  }

  return key;
}

/** AES-256-GCM. Output: v1.<iv>.<auth tag>.<ciphertext>, each part base64url. */
export function encryptRefreshToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [ENCRYPTED_TOKEN_VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
}

export function decryptRefreshToken(encrypted: string): string {
  const [version, iv, tag, ciphertext, ...rest] = encrypted.split('.');
  if (version !== ENCRYPTED_TOKEN_VERSION || !iv || !tag || !ciphertext || rest.length > 0) {
    throw new Error('Unrecognised encrypted token format');
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

// OAuth `state`: encrypted so the browser can't read or alter it, and bound to a nonce in an httpOnly cookie.
export type OAuthState = {
  userId: string;
  // From a signed Slack link. Null when connecting from the plain page.
  slackUserId: string | null;
  timeZone: string | null;
  nonce: string;
  // Lets the callback send the person back to the connect page with their link if something goes wrong
  connectToken: string | null;
};

// Derived from the token encryption key, with a label so the two uses never share a key
const getStateKey = (): Uint8Array => createHash('sha256').update('calendar-connect-oauth-state:').update(getEncryptionKey()).digest();

export async function createOAuthState(state: OAuthState): Promise<string> {
  return new EncryptJWT({ ...state })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .encrypt(getStateKey());
}

export class InvalidOAuthStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOAuthStateError';
  }
}

/** Decrypts `state` and checks it belongs to this browser (the cookie nonce). */
export async function verifyOAuthState({ state, cookieNonce }: { state: string; cookieNonce: string | undefined }): Promise<OAuthState> {
  let payload: Partial<OAuthState>;
  try {
    ({ payload } = await jwtDecrypt<Partial<OAuthState>>(state, getStateKey(), { keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] }));
  } catch (error) {
    if (createHttpError.isHttpError(error)) throw error;
    throw new InvalidOAuthStateError(error instanceof errors.JWTExpired ? 'expired' : 'invalid');
  }

  if (typeof payload.userId !== 'string' || typeof payload.nonce !== 'string') {
    throw new InvalidOAuthStateError('invalid');
  }

  if (!cookieNonce || !secretsMatch(cookieNonce, payload.nonce)) {
    throw new InvalidOAuthStateError('browser mismatch');
  }

  return {
    userId: payload.userId,
    slackUserId: typeof payload.slackUserId === 'string' ? payload.slackUserId : null,
    timeZone: typeof payload.timeZone === 'string' ? payload.timeZone : null,
    nonce: payload.nonce,
    connectToken: typeof payload.connectToken === 'string' ? payload.connectToken : null,
  };
}

export function newNonce(): string {
  return randomBytes(32).toString('base64url');
}

export function stateCookie({ nonce, maxAgeSeconds = STATE_TTL_SECONDS }: { nonce: string; maxAgeSeconds?: number }): string {
  const secure = getSiteUrl().startsWith('https://') ? '; Secure' : '';
  // Lax, not Strict: the cookie has to come back on Google's top-level redirect to the callback
  return `${STATE_COOKIE_NAME}=${nonce}; Path=${GOOGLE_CALLBACK_PATH}; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearStateCookie(): string {
  return stateCookie({ nonce: '', maxAgeSeconds: 0 });
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const getGoogleClientCredentials = () => ({
  clientId: requireEnv('GOOGLE_CALENDAR_CLIENT_ID'),
  clientSecret: requireEnv('GOOGLE_CALENDAR_CLIENT_SECRET'),
});

export const getBusyApiSecret = () => requireEnv('CALENDAR_CONNECT_BUSY_API_SECRET');
