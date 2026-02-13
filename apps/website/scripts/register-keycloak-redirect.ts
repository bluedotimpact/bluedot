/* eslint-disable no-console */

/**
 * Registers the current Render preview URL as an allowed redirect URI
 * in KeyCloak for the website client. Intended to run as a Render
 * pre-deploy command.
 *
 * Required env vars:
 *   RENDER_EXTERNAL_URL - set automatically by Render
 *   KEYCLOAK_PREVIEW_CLIENT_ID - service account with manage-clients role
 *   KEYCLOAK_PREVIEW_CLIENT_SECRET - service account secret
 */

const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';
const KEYCLOAK_REALM = 'customers';
const TARGET_CLIENT_ID = 'bluedot-web-apps';

async function getAdminToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get admin token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as { access_token: string };

  return data.access_token;
}

async function getClientByClientId(token: string): Promise<{ id: string; redirectUris: string[]; webOrigins: string[] }> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${TARGET_CLIENT_ID}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch client: ${response.status} ${await response.text()}`);
  }

  const clients = await response.json() as { id: string; redirectUris: string[]; webOrigins: string[] }[];
  if (clients.length === 0) {
    throw new Error(`Client '${TARGET_CLIENT_ID}' not found in realm '${KEYCLOAK_REALM}'`);
  }

  return clients[0]!;
}

async function updateClientRedirectUris(
  token: string,
  internalId: string,
  redirectUris: string[],
  webOrigins: string[],
): Promise<void> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${internalId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ redirectUris, webOrigins }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update client: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  const previewUrl = process.env.RENDER_EXTERNAL_URL;
  if (!previewUrl) {
    console.log('RENDER_EXTERNAL_URL not set, skipping KeyCloak redirect URI registration');

    return;
  }

  const clientId = process.env.KEYCLOAK_PREVIEW_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_PREVIEW_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('KEYCLOAK_PREVIEW_CLIENT_ID and KEYCLOAK_PREVIEW_CLIENT_SECRET must be set');
    process.exit(1);
  }

  const redirectUri = `${previewUrl}/*`;

  console.log(`Registering redirect URI: ${redirectUri}`);

  const token = await getAdminToken(clientId, clientSecret);
  const client = await getClientByClientId(token);

  if (client.redirectUris.includes(redirectUri)) {
    console.log('Redirect URI already registered, nothing to do');

    return;
  }

  const updatedRedirectUris = [...client.redirectUris, redirectUri];
  const updatedWebOrigins = client.webOrigins.includes(previewUrl)
    ? client.webOrigins
    : [...client.webOrigins, previewUrl];

  await updateClientRedirectUris(token, client.id, updatedRedirectUris, updatedWebOrigins);

  console.log('Successfully registered redirect URI');
}

main().catch((error) => {
  console.error('Failed to register KeyCloak redirect URI:', error);
  process.exit(1);
});
