import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { PgAirtableTable } from './db-core';
import * as schema from '../schema';

/**
 * Test that validates schema exports without requiring a live database
 * This ensures that all PgAirtableTable instances are properly configured
 */
describe('Schema Validation', () => {
  it('should find PgAirtableTable instances in schema', () => {
    const exports = Object.entries(schema);
    const airtableTables: { name: string; tableName: string }[] = [];

    for (const [exportName, exportValue] of exports) {
      if (exportValue instanceof PgAirtableTable) {
        const tableName = getTableName(exportValue.pg);
        airtableTables.push({ name: exportName, tableName });
      }
    }

    // Should have at least some PgAirtableTable instances
    expect(airtableTables.length).toBeGreaterThan(0);

    // Log found tables for debugging
    console.log(`Found ${airtableTables.length} PgAirtable tables:`);
    airtableTables.forEach(({ name, tableName }) => {
      console.log(`  - ${name} (${tableName})`);
    });
  });

  it('should have valid table names for all PgAirtableTable instances', () => {
    const exports = Object.entries(schema);

    for (const [exportName, exportValue] of exports) {
      if (exportValue instanceof PgAirtableTable) {
        const tableName = getTableName(exportValue.pg);

        // Table name should be a non-empty string
        expect(tableName, `Table name for ${exportName} should be truthy`).toBeTruthy();
        expect(typeof tableName).toBe('string');
        expect(tableName.length).toBeGreaterThan(0);

        // Table name should not contain spaces or special characters (basic validation)
        expect(tableName, `Table name for ${exportName} should match pattern`).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
      }
    }
  });

  it('should have valid airtable configuration for all PgAirtableTable instances', () => {
    const exports = Object.entries(schema);

    for (const [exportName, exportValue] of exports) {
      if (exportValue instanceof PgAirtableTable) {
        // Should have airtable configuration
        expect(exportValue.airtable, `${exportName} should have airtable config`).toBeDefined();
        expect(exportValue.airtable.baseId, `${exportName} should have baseId`).toBeTruthy();
        expect(exportValue.airtable.tableId, `${exportName} should have tableId`).toBeTruthy();

        // Should have field mappings
        expect(exportValue.airtableFieldMap, `${exportName} should have field mappings`).toBeDefined();
        expect(exportValue.airtableFieldMap.size, `${exportName} should have at least one field mapping`).toBeGreaterThan(0);

        // All field mappings should have valid values
        for (const [pgFieldName, airtableFieldId] of exportValue.airtableFieldMap.entries()) {
          expect(pgFieldName, `${exportName} field name should be truthy`).toBeTruthy();
          expect(typeof pgFieldName).toBe('string');
          expect(airtableFieldId, `${exportName} airtable field ID should be truthy`).toBeTruthy();
          expect(typeof airtableFieldId).toBe('string');
        }
      }
    }
  });
});
