/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const [{ sql }, { default: db }] = await Promise.all([
    import('@bluedot/db'),
    import('../src/lib/api/db'),
  ]);

  const tableCheck = await db.pg.execute(sql`
    SELECT to_regclass('public.grant_grantee') AS "tableName"
  `);

  const metaCheck = await db.pg.execute(sql`
    SELECT COUNT(*)::int AS "count"
    FROM meta
    WHERE "pgTable" = 'grant_grantee'
  `);

  const tableExists = Boolean(tableCheck.rows[0]?.tableName);
  const metaCount = Number(metaCheck.rows[0]?.count ?? 0);

  console.log('Rapid grants sync health');
  console.log(`- grant_grantee table exists: ${tableExists ? 'yes' : 'no'}`);
  console.log(`- meta registrations for grant_grantee: ${metaCount}`);

  if (!tableExists) {
    console.log('');
    console.log('The website database does not have the grant_grantee table yet.');
    console.log('Next step: run pg-sync-service from the current codebase revision against the same PG_URL as the website, then trigger a full sync.');
    return;
  }

  const rowStats = await db.pg.execute(sql`
    SELECT
      COUNT(*)::int AS "totalRows",
      COUNT(*) FILTER (
        WHERE COALESCE(TRIM(name), '') <> ''
        AND COALESCE(TRIM("projectName"), '') <> ''
      )::int AS "renderableRows"
    FROM grant_grantee
  `);

  const sampleRows = await db.pg.execute(sql`
    SELECT
      name,
      "projectName",
      "amountUsd"
    FROM grant_grantee
    WHERE COALESCE(TRIM(name), '') <> ''
      AND COALESCE(TRIM("projectName"), '') <> ''
    ORDER BY "projectName" ASC
    LIMIT 10
  `);

  const totalRows = Number(rowStats.rows[0]?.totalRows ?? 0);
  const renderableRows = Number(rowStats.rows[0]?.renderableRows ?? 0);

  console.log(`- total synced rows: ${totalRows}`);
  console.log(`- renderable rows: ${renderableRows}`);

  if (sampleRows.rows.length > 0) {
    console.log('');
    console.log('Sample renderable rows:');
    for (const row of sampleRows.rows) {
      const amountLabel = row.amountUsd === null || row.amountUsd === undefined
        ? ''
        : ` (${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(Number(row.amountUsd))})`;
      console.log(`- ${row.projectName} — ${row.name}${amountLabel}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error('check-grants-sync failed:', error);
  process.exit(1);
});
