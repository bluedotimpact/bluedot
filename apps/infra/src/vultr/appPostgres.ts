import * as vultr from '@ediri/vultr';

// The primary production Postgres database. Business provisions a primary + standby replica and 14-day point-in-time recovery.
export const appPg = new vultr.Database('app-pg', {
  label: 'bluedot-app',
  databaseEngine: 'pg',
  databaseEngineVersion: '18',
  region: 'ams',
  plan: 'vultr-dbaas-business-cc-2-80-4',
  // The public endpoint has no IP allowlist: it is gated by forced SSL + a strong Vultr-generated
  // credential held only in secrets, and staying public keeps direct dev access simple (no tunnel).
}, {
  protect: true,
});

// If you add another database here, re-check that admin-level access is still appropriate.
//
// A scoped read-only role `bluedot_dev` exists for dev psql access over
// untrusted networks (issue #2586). It's created manually via psql (not in IaC).
// Credentials and the GRANT recipe live in 1Password ("Postgres - app-pg
// (Vultr) - bluedot_dev (read-only dev)").
export const appDatabase = new vultr.DatabaseDb('app-db', {
  databaseId: appPg.id,
  name: 'app',
}, {
  protect: true,
});
