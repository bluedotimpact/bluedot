/* eslint-disable no-console */

/**
 * Registers the current Render preview URL as an allowed redirect URI
 * in KeyCloak for the website client, and cleans up URIs for closed PRs.
 * Intended to run as a Render pre-deploy command.
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
const GITHUB_REPO = 'bluedotimpact/bluedot';

const PERMANENT_URIS = new Set([
  'https://frontend-example.k8s.bluedot.org/*',
  'https://app-template.k8s.bluedot.org/*',
  'https://website-staging.k8s.bluedot.org/*',
  'https://bluedot.org/*',
  'http://localhost:8000/*',
]);

const keycloakFetch = async (path: string, options?: RequestInit) => {
  const response = await fetch(`${KEYCLOAK_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`KeyCloak ${path}: ${response.status} ${await response.text()}`);
  }

  return response;
};

async function isPrOpen(prNumber: number): Promise<boolean> {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (response.status === 404) {
    return false; // PR doesn't exist
  }

  if (!response.ok) {
    console.warn(`Failed to check PR #${prNumber}: ${response.status}, keeping URI`);

    return true; // keep URI if we can't check
  }

  const pr = await response.json() as { state: string };

  return pr.state === 'open';
}

function extractPrNumber(uri: string): number | null {
  const match = (/-pr-(\d+)/).exec(uri);

  return match ? Number(match[1]) : null;
}

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
  let uris = [...client.redirectUris];

  // Add new redirect URI
  if (!uris.includes(redirectUri)) {
    uris.push(redirectUri);
    console.log('Added redirect URI');
  } else {
    console.log('Redirect URI already registered');
  }

  // Clean up URIs for closed PRs
  for (const uri of client.redirectUris) {
    if (PERMANENT_URIS.has(uri)) {
      continue;
    }

    const prNumber = extractPrNumber(uri);
    if (prNumber === null) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const open = await isPrOpen(prNumber);
    if (!open) {
      console.log(`Removing URI for closed PR #${prNumber}: ${uri}`);
      uris = uris.filter((u) => u !== uri);
    }
  }

  // Update if changed
  if (uris.length === client.redirectUris.length && uris.every((u) => client.redirectUris.includes(u))) {
    console.log('No changes needed');

    return;
  }

  // Safety check: never remove permanent URIs
  for (const permanent of PERMANENT_URIS) {
    if (!uris.includes(permanent) && client.redirectUris.includes(permanent)) {
      throw new Error(`Bug: would have removed permanent URI ${permanent}`);
    }
  }

  await keycloakFetch(`/admin/realms/${KEYCLOAK_REALM}/clients/${client.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectUris: uris }),
  });

  console.log(`Updated redirect URIs (${client.redirectUris.length} -> ${uris.length})`);
}

main().catch((error: unknown) => {
  console.error('Failed to register KeyCloak redirect URI:', error);
  process.exit(1);
});
