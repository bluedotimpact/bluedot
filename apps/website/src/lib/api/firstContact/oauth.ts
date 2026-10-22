// OAuth for /welcome: a one-off Google sign-in that reads the new hire's free/busy times once. Nothing is stored.

import { EncryptJWT, errors, jwtDecrypt } from 'jose';
import env from '../env';
import {
  GOOGLE_FREEBUSY_SCOPE, deriveKey, getSiteUrl, isValidTimeZone, secretsMatch,
} from '../calendarConnect';

export const WELCOME_PAGE_PATH = '/welcome';
export const WELCOME_CALLBACK_PATH = '/api/welcome/google/callback';
// `profile` gives us their name for the invites and the #welcome post
export const WELCOME_GOOGLE_SCOPES = ['openid', 'email', 'profile', GOOGLE_FREEBUSY_SCOPE];

export const WELCOME_STATE_COOKIE_NAME = 'welcome_state';
const STATE_TTL_SECONDS = 10 * 60;

export type WelcomeOAuthState = { nonce: string; timeZone: string };

export const getWelcomeRedirectUri = () => `${getSiteUrl()}${WELCOME_CALLBACK_PATH}`;

export function checkWelcomePassword(given: string): boolean {
  const expected = env.WELCOME_PASSWORD;
  // Case and spaces don't matter, so "Carl Sagan" works as well as "carlsagan"
  const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, '');
  return !!expected && secretsMatch(normalise(given), normalise(expected));
}

const getStateKey = () => deriveKey('first-contact-oauth-state');

export async function createWelcomeState(state: WelcomeOAuthState): Promise<string> {
  return new EncryptJWT({ ...state })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .encrypt(getStateKey());
}

/** Decrypts `state` and checks it belongs to this browser. Throws 'expired' or 'invalid'. */
export async function verifyWelcomeState({ state, cookieNonce }: { state: string; cookieNonce: string | undefined }): Promise<WelcomeOAuthState> {
  let payload: Partial<WelcomeOAuthState>;
  try {
    ({ payload } = await jwtDecrypt<Partial<WelcomeOAuthState>>(state, getStateKey(), { keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] }));
  } catch (error) {
    throw new Error(error instanceof errors.JWTExpired ? 'expired' : 'invalid');
  }

  if (typeof payload.nonce !== 'string' || !cookieNonce || !secretsMatch(cookieNonce, payload.nonce)) {
    throw new Error('invalid');
  }

  return {
    nonce: payload.nonce,
    timeZone: typeof payload.timeZone === 'string' && isValidTimeZone(payload.timeZone) ? payload.timeZone : 'America/Los_Angeles',
  };
}

export function welcomeStateCookie({ nonce, maxAgeSeconds = STATE_TTL_SECONDS }: { nonce: string; maxAgeSeconds?: number }): string {
  const secure = getSiteUrl().startsWith('https://') ? '; Secure' : '';
  // Lax, not Strict: the cookie has to come back on Google's top-level redirect to the callback
  return `${WELCOME_STATE_COOKIE_NAME}=${nonce}; Path=${WELCOME_CALLBACK_PATH}; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}
