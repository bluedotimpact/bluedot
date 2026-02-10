import axios from 'axios';
import createHttpError from 'http-errors';
import env from './env';

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';

let adminTokenCache: {
  token: string;
  expiresAtSeconds: number; // Unix timestamp in seconds
} | null = null;

// Cache expiration buffer (1 minute in seconds)
const CACHE_EXPIRATION_BUFFER_IN_SECONDS = 60;

export async function verifyKeycloakPassword(
  email: string,
  password: string,
): Promise<boolean> {
  // Validate environment variables
  if (!env.KEYCLOAK_CLIENT_ID || !env.KEYCLOAK_CLIENT_SECRET) {
    throw createHttpError.ServiceUnavailable('Authentication service not configured. Please contact support.');
  }

  try {
    const response = await axios.post(
      `${KEYCLOAK_BASE_URL}/realms/customers/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: env.KEYCLOAK_CLIENT_ID,
        client_secret: env.KEYCLOAK_CLIENT_SECRET,
        username: email,
        password,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return !!response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return false;
    }

    // Provide more context for other errors
    if (axios.isAxiosError(error)) {
      throw createHttpError.ServiceUnavailable('Authentication service is currently unavailable. Please try again later.');
    }

    throw createHttpError.InternalServerError('An unexpected error occurred during authentication.');
  }
}

export async function updateKeycloakPassword(
  userSub: string,
  newPassword: string,
): Promise<void> {
  // Validate environment variables
  if (!env.KEYCLOAK_CLIENT_ID || !env.KEYCLOAK_CLIENT_SECRET) {
    throw createHttpError.ServiceUnavailable('Authentication service not configured. Please contact support.');
  }

  try {
    const adminToken = await getAdminToken();

    await axios.put(
      `${KEYCLOAK_BASE_URL}/admin/realms/customers/users/${userSub}/reset-password`,
      {
        type: 'password',
        value: newPassword,
        temporary: false,
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Clear cache on authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        adminTokenCache = null;
      }

      if (error.response?.status === 400) {
        // Password policy violation
        const errorMessage = error.response?.data?.error || 'Password does not meet requirements';
        throw createHttpError.BadRequest(errorMessage);
      }
    }

    // Provide more context for other errors
    if (axios.isAxiosError(error)) {
      throw createHttpError.ServiceUnavailable('Authentication service is currently unavailable. Please try again later.');
    }

    throw createHttpError.InternalServerError('An unexpected error occurred while updating password.');
  }
}

async function getAdminToken(): Promise<string> {
  // Check if we have a valid cached token
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  if (adminTokenCache && currentTimeSeconds < adminTokenCache.expiresAtSeconds) {
    return adminTokenCache.token;
  }

  try {
    const response = await axios.post(
      `${KEYCLOAK_BASE_URL}/realms/customers/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.KEYCLOAK_CLIENT_ID,
        client_secret: env.KEYCLOAK_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { access_token: accessToken, expires_in: expiresIn } = response.data as { access_token: string; expires_in: number };

    // Cache the token with expiration time
    // expires_in is already in seconds
    // Subtract buffer to expire cache 1 minute before actual expiration
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + expiresIn - CACHE_EXPIRATION_BUFFER_IN_SECONDS;

    adminTokenCache = {
      token: accessToken,
      expiresAtSeconds,
    };

    return accessToken;
  } catch (error) {
    // Clear cache on authentication errors
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      adminTokenCache = null;
    }

    if (axios.isAxiosError(error)) {
      throw createHttpError.ServiceUnavailable('Authentication service is currently unavailable. Please try again later.');
    }

    throw error;
  }
}
