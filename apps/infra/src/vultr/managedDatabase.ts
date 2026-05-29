import * as vultr from '@ediri/vultr';

// Managed Postgres for the Airtable replica (#2575, part of #2572).
//
// Business tier is deliberate: it provisions a primary + standby replica and 14-day
// point-in-time recovery, which is what makes this durable enough to host the
// Postgres-authoritative tables (exercise responses, resource completions) that are
// leaving Airtable. Plan id, $100/mo cost, and ams availability confirmed against
// https://api.vultr.com/v2/databases/plans?engine=pg
export const airtableSyncManagedPg = new vultr.Database('airtable-sync-managed-pg', {
  label: 'bluedot-airtable-sync',
  databaseEngine: 'pg',
  databaseEngineVersion: '17',
  region: 'ams',
  plan: 'vultr-dbaas-business-cc-2-80-4',
});

// Dedicated logical database, mirroring the intent of the old CNPG `app` database.
export const airtableSyncManagedDb = new vultr.DatabaseDb('airtable-sync-managed-db', {
  databaseId: airtableSyncManagedPg.id,
  name: 'airtable_sync',
});
