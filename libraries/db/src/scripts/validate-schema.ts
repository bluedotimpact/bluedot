/* eslint-disable no-console */
import { getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../schema';
import { PgAirtableTable } from '../lib/db-core';

/**
 * In order for `drizzle-kit` (e.g. `db:push`) to recognise them, tables must be exported
 * at the top level as a `pgTable` return type, not the `pgAirtable` that we defined.
 * This requires a line of boilerplate for each defined table:
 * ```typescript
 * export const courseTablePg = courseTable.pg;
 * ```
 */
function validateSchemaExports(): boolean {
  const exports = Object.entries(schema);
  const errors: string[] = [];

  for (const [exportName, exportValue] of exports) {
    if (exportValue instanceof PgAirtableTable) {
      const airtableTableName = getTableName(exportValue.pg);

      // Find any exported PgTable with the same table name
      const matchingPgTable = exports.find(([, value]) => {
        return is(value, PgTable) && getTableName(value) === airtableTableName;
      });

      if (!matchingPgTable) {
        errors.push(`Missing PgTable export with table name '${airtableTableName}' for '${exportName}'`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('🚨 Schema validation failed:\n');
    errors.forEach((error) => console.error(error));
    console.error('Add a PgTable export like: export const userTablePg = userTable.pg;');
    console.error('This is required for drizzle-kit to recognize your custom tables.\n');
    return false;
  }

  console.log('✅ Schema validation passed - all PgAirtable tables have corresponding Pg exports');
  return true;
}

if (require.main === module) {
  const isValid = validateSchemaExports();
  process.exit(isValid ? 0 : 1);
} else {
  console.error('validate-schema script was imported, it should only be executed directly.');
}
