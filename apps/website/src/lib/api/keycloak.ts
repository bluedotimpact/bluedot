import axios from 'axios';
import createHttpError from 'http-errors';
import env from './env';

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';
const PUBLIC_LOGIN_CLIENT_ID = 'bluedot-web-apps';

const PERMANENT_URIS = new Set([
  'https://frontend-example.k8s.bluedot.org/*',
  'https://app-template.k8s.bluedot.org/*',
  'https://website-staging.k8s.bluedot.org/*',
  'https://bluedot.org/*',
  'http://localhost:8000/*',
]);

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
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

// Preview redirect URI management: support adding preview environments to the list of
// allowed redirects and clean up old preview environments for PRs that are now closed

function extractPrNumber(uri: string): number | null {
  const match = (/-pr-(\d+)/).exec(uri);
  return match ? Number(match[1]) : null;
}

/**
 * Returns true on error to avoid accidentally removing active URIs.
 */
async function isPrOpen(prNumber: number): Promise<boolean> {
  try {
    const response = await axios.get(`https://api.github.com/repos/bluedotimpact/bluedot/pulls/${prNumber}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      validateStatus: (status) => status < 500,
    });

    if (response.status === 404) {
      return false;
    }

    if (response.status !== 200) {
      return true;
    }

    return (response.data as { state: string }).state === 'open';
  } catch {
    return true;
  }
}

export async function registerPreviewRedirectUri(redirectUri: string): Promise<{ added: boolean; cleaned: number }> {
  const token = await getAdminToken();

  // Get current client config
  const clientsResponse = await axios.get(
    `${KEYCLOAK_BASE_URL}/admin/realms/customers/clients?clientId=${PUBLIC_LOGIN_CLIENT_ID}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const clients = clientsResponse.data as Record<string, unknown>[];
  if (clients.length === 0) {
    throw createHttpError.InternalServerError(`Client '${PUBLIC_LOGIN_CLIENT_ID}' not found`);
  }

  const client = clients[0]!;
  const existingUris = client.redirectUris as string[];
  let uris = [...existingUris];

  const added = !uris.includes(redirectUri);
  if (added) {
    uris.push(redirectUri);
  }

  // Clean up URIs for closed PRs
  const previewUris = existingUris.filter((uri) => !PERMANENT_URIS.has(uri) && extractPrNumber(uri) !== null);
  const openStatuses = await Promise.all(previewUris.map((uri) => isPrOpen(extractPrNumber(uri)!)));
  const staleUris = new Set(previewUris.filter((_, i) => !openStatuses[i]));
  uris = uris.filter((uri) => !staleUris.has(uri));
  const cleaned = staleUris.size;

  if (uris.length === existingUris.length && uris.every((u) => existingUris.includes(u))) {
    return { added, cleaned };
  }

  // Safety check: never remove permanent URIs
  for (const permanent of PERMANENT_URIS) {
    if (!uris.includes(permanent) && existingUris.includes(permanent)) {
      throw createHttpError.InternalServerError(`Bug: would have removed permanent URI ${permanent}`);
    }
  }

  // Update client with full representation
  await axios.put(
    `${KEYCLOAK_BASE_URL}/admin/realms/customers/clients/${client.id as string}`,
    { ...client, redirectUris: uris },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );

  return { added, cleaned };
}
