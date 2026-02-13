import env from './api/env';

export const SITE_AUTH_COOKIE = 'SITE_AUTH_TOKEN';

export const checkPassword = (password: string) => {
  const expected = env.SITE_ACCESS_PASSWORD;
  if (!expected) {
    return false;
  }

  return password === expected;
};

const hashPassword = async (password: string) => {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert to hex string (avoids btoa which is restricted by lint, and Buffer which is unavailable in Edge Runtime)
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

let cachedToken: string | null = null;

export const getAuthToken = async () => {
  const password = env.SITE_ACCESS_PASSWORD;
  if (!password) {
    return null;
  }

  cachedToken ??= await hashPassword(password);

  return cachedToken;
};

export const checkAuthToken = async (token: string | undefined) => {
  if (!token) {
    return false;
  }

  const expected = await getAuthToken();

  return token === expected;
};
