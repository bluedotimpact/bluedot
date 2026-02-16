/* eslint-disable no-console */

/**
 * Registers the current Render preview URL as an allowed redirect URI
 * in KeyCloak for the website client. Intended to run as a Render
 * pre-deploy command.
 */

import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'RENDER_EXTERNAL_URL',
    'KEYCLOAK_PREVIEW_CLIENT_ID',
    'KEYCLOAK_PREVIEW_CLIENT_SECRET',
  ],
});

const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';
const KEYCLOAK_REALM = 'customers';
const TARGET_CLIENT_ID = 'bluedot-web-apps';

const keycloakFetch = async (path: string, options?: RequestInit) => {
  const response = await fetch(`${KEYCLOAK_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`KeyCloak ${path}: ${response.status} ${await response.text()}`);
  }

  return response;
};

async function main() {
  const redirectUri = `${env.RENDER_EXTERNAL_URL}/*`;
  console.log(`Registering redirect URI: ${redirectUri}`);

  // Get admin token
  const tokenResponse = await keycloakFetch(`/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.KEYCLOAK_PREVIEW_CLIENT_ID,
      client_secret: env.KEYCLOAK_PREVIEW_CLIENT_SECRET,
    }),
  });
  const { access_token: token } = await tokenResponse.json() as { access_token: string };

  // Get current client config
  const clientsResponse = await keycloakFetch(`/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${TARGET_CLIENT_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const clients = await clientsResponse.json() as { id: string; redirectUris: string[] }[];
  if (clients.length === 0) {
    throw new Error(`Client '${TARGET_CLIENT_ID}' not found`);
  }

  const client = clients[0]!;

  if (client.redirectUris.includes(redirectUri)) {
    console.log('Redirect URI already registered, nothing to do');
    return;
  }

  // Add redirect URI
  await keycloakFetch(`/admin/realms/${KEYCLOAK_REALM}/clients/${client.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectUris: [...client.redirectUris, redirectUri] }),
  });

  console.log('Successfully registered redirect URI');
}

main().catch((error: unknown) => {
  console.error('Failed to register KeyCloak redirect URI:', error);
  process.exit(1);
});
