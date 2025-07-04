import axios from 'axios';
import createHttpError from 'http-errors';
import env from './env';

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';

export async function verifyKeycloakPassword(
  email: string,
  password: string,
): Promise<boolean> {
  // Validate environment variables
  if (!env.KEYCLOAK_CLIENT_ID || !env.KEYCLOAK_CLIENT_SECRET) {
    throw new Error(
      'Keycloak configuration missing: KEYCLOAK_CLIENT_ID or KEYCLOAK_CLIENT_SECRET not set',
    );
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
    throw new Error('Failed to verify password');
  }
}

export async function updateKeycloakPassword(
  userSub: string,
  newPassword: string,
): Promise<void> {
  // Validate environment variables
  if (!env.KEYCLOAK_CLIENT_ID || !env.KEYCLOAK_CLIENT_SECRET) {
    throw new Error(
      'Keycloak configuration missing: KEYCLOAK_CLIENT_ID or KEYCLOAK_CLIENT_SECRET not set',
    );
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
      if (error.response?.status === 400) {
        // Password policy violation
        const errorMessage = error.response?.data?.error || 'Password does not meet requirements';
        throw createHttpError.BadRequest(errorMessage);
      }
    }
    throw new Error('Failed to update password in Keycloak');
  }
}

// Helper function to get admin token (not exported)
async function getAdminToken(): Promise<string> {
  const response = await axios.post(
    `${KEYCLOAK_BASE_URL}/realms/customers/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.KEYCLOAK_CLIENT_ID,
      client_secret: env.KEYCLOAK_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  return response.data.access_token;
}
