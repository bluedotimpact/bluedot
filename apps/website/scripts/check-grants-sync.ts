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
    SELECT to_regclass('public.grant') AS "tableName"
  `);

  const metaCheck = await db.pg.execute(sql`
    SELECT COUNT(*)::int AS "count"
    FROM meta
    WHERE "pgTable" = 'grant'
  `);

  const tableExists = Boolean(tableCheck.rows[0]?.tableName);
  const metaCount = Number(metaCheck.rows[0]?.count ?? 0);

  console.log('Rapid grants sync health');
  console.log(`- grant table exists: ${tableExists ? 'yes' : 'no'}`);
  console.log(`- meta registrations for grant: ${metaCount}`);

  if (!tableExists) {
    console.log('');
    console.log('The website database does not have the grant table yet.');
    console.log('Next step: run pg-sync-service from the current codebase revision against the same PG_URL as the website, then trigger a full sync.');
    return;
  }

  const rowStats = await db.pg.execute(sql`
    SELECT
      COUNT(*)::int AS "totalRows",
      COUNT(*) FILTER (
        WHERE COALESCE(TRIM("granteeName"), '') <> ''
        AND COALESCE(TRIM("projectTitle"), '') <> ''
      )::int AS "renderableRows"
    FROM grant
  `);

  const sampleRows = await db.pg.execute(sql`
    SELECT
      "granteeName",
      "projectTitle",
      "amountUsd"
    FROM grant
    WHERE COALESCE(TRIM("granteeName"), '') <> ''
      AND COALESCE(TRIM("projectTitle"), '') <> ''
    ORDER BY "projectTitle" ASC
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
      console.log(`- ${row.projectTitle} — ${row.granteeName}${amountLabel}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error('check-grants-sync failed:', error);
  process.exit(1);
});
