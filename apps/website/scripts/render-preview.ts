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

function run(cmd: string, extraEnv?: Record<string, string>) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

// ── build ──────────────────────────────────────────────────────────────

function build() {
  const { RENDER_EXTERNAL_URL } = validateEnv({ required: ['RENDER_EXTERNAL_URL'] });

  run('npm run build', { NEXT_PUBLIC_SITE_URL: RENDER_EXTERNAL_URL });
  run('cp -r public/. dist/standalone/apps/website/public/');
  run('cp -r dist/static dist/standalone/apps/website/dist/static');
}

// ── start ──────────────────────────────────────────────────────────────

function start() {
  const { RENDER_EXTERNAL_URL } = validateEnv({ required: ['RENDER_EXTERNAL_URL'] });

  run('node dist/standalone/apps/website/server.js', { NEXT_PUBLIC_SITE_URL: RENDER_EXTERNAL_URL });
}

// ── pre-deploy (keycloak redirect registration via production endpoint) ──

async function preDeploy() {
  const { RENDER_EXTERNAL_URL, KEYCLOAK_PREVIEW_AUTH_TOKEN } = validateEnv({
    required: ['RENDER_EXTERNAL_URL', 'KEYCLOAK_PREVIEW_AUTH_TOKEN'],
  });

  const redirectUri = `${RENDER_EXTERNAL_URL}/*`;
  console.log(`Registering redirect URI: ${redirectUri}`);

  const response = await fetch('https://bluedot.org/api/keycloak-register-preview-redirect-uri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectUri, token: KEYCLOAK_PREVIEW_AUTH_TOKEN }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Production endpoint returned ${response.status}: ${body}`);
  }

  const { added, cleaned } = await response.json() as { added: boolean; cleaned: number };
  console.log(`Done: ${added ? 'added redirect URI' : 'URI already registered'}, cleaned ${cleaned} stale URIs`);
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
