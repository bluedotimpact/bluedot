import * as vultr from '@ediri/vultr';

// The primary production Postgres database. Business tier is deliberate: it provisions a
// primary + standby replica and 14-day point-in-time recovery, which is what makes it durable
// enough to hold authoritative data. Plan id, $100/mo cost, and ams availability confirmed
// against https://api.vultr.com/v2/databases/plans?engine=pg
export const managedPg = new vultr.Database('managed-pg', {
  label: 'bluedot-app',
  databaseEngine: 'pg',
  databaseEngineVersion: '18',
  region: 'ams',
  plan: 'vultr-dbaas-business-cc-2-80-4',
  // No trustedIps (IP allowlist) by design: matches our established pattern (the existing in-node
  // Postgres is likewise reachable publicly, gated by credential) and keeps direct dev access
  // simple, with no VPC tunnel. The endpoint is gated by forced SSL + a strong Vultr-generated
  // credential held only in secrets.
}, {
  // Holds Postgres-authoritative data (exercise responses, resource completions) that no longer
  // lives in Airtable, so guard against accidental deletion via destroy / code removal.
  protect: true,
});

// The application's logical database. Connections use the cluster admin user: this instance holds
// only this one database, so a scoped role would need full read/write on it anyway. If you add
// another database here, re-check that admin-level access is still appropriate.
export const appDatabase = new vultr.DatabaseDb('managed-app-db', {
  databaseId: managedPg.id,
  name: 'app',
}, {
  // The tables live in this logical database, so dropping it loses data even if the cluster survives.
  protect: true,
});
