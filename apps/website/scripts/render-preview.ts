/* eslint-disable no-console */

/**
 * Script for creating Render preview deployments.
 *
 * Usage:
 *   npm run render-preview -- build
 *   npm run render-preview -- pre-deploy
 *   npm run render-preview -- start
 *
 * Render dashboard commands:
 *   Build:      cd apps/website && npm install && npm run render-preview -- build
 *   Pre-deploy: cd apps/website && npm run render-preview -- pre-deploy
 *   Start:      cd apps/website && npm run render-preview -- start
 */

import { execSync } from 'child_process';
import { validateEnv } from '@bluedot/utils';

const command = process.argv[2];

function run(cmd: string) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// ── build ──────────────────────────────────────────────────────────────

function build() {
  const { RENDER_EXTERNAL_URL } = validateEnv({ required: ['RENDER_EXTERNAL_URL'] });

  run(`NEXT_PUBLIC_SITE_URL=${RENDER_EXTERNAL_URL} npm run build`);
  run('cp -r public/. dist/standalone/apps/website/public/');
  run('cp -r dist/static dist/standalone/apps/website/dist/static');
}

// ── start ──────────────────────────────────────────────────────────────

function start() {
  const { RENDER_EXTERNAL_URL } = validateEnv({ required: ['RENDER_EXTERNAL_URL'] });

  run(`NEXT_PUBLIC_SITE_URL=${RENDER_EXTERNAL_URL} node dist/standalone/apps/website/server.js`);
}

// ── pre-deploy (keycloak redirect registration) ────────────────────────

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
    return false;
  }

  if (!response.ok) {
    console.warn(`Failed to check PR #${prNumber}: ${response.status}, keeping URI`);

    return true;
  }

  const pr = await response.json() as { state: string };

  return pr.state === 'open';
}

function extractPrNumber(uri: string): number | null {
  const match = (/-pr-(\d+)/).exec(uri);

  return match ? Number(match[1]) : null;
}

async function preDeploy() {
  const env = validateEnv({
    required: [
      'RENDER_EXTERNAL_URL',
      'KEYCLOAK_PREVIEW_CLIENT_ID',
      'KEYCLOAK_PREVIEW_CLIENT_SECRET',
    ],
  });

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

// ── main ───────────────────────────────────────────────────────────────

async function main() {
  switch (command) {
    case 'build':
      build();
      break;
    case 'pre-deploy':
      await preDeploy();
      break;
    case 'start':
      start();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: npm run render-preview -- <build|pre-deploy|start>');
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error('render-preview failed:', error);
  process.exit(1);
});
