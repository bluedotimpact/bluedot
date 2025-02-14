import { describe, expect, test } from 'vitest';
import { readdirSync } from 'fs';
import { migrations } from './list';

// to avoid forgetting to add a migration to the list
describe('all migrations have been added to list', () => {
  const EXCLUDED_FILES = [
    'list.ts',
    'migrator.ts',
  ];
  const migrationFiles = readdirSync(__dirname).filter((f) => !f.endsWith('.test.ts') && !EXCLUDED_FILES.includes(f));

  test.each(migrationFiles)('file: %s', (file) => {
    expect(file.endsWith('.ts')).toBe(true);
    expect(migrations[file.slice(0, -3)]).toBeTruthy();
  });
});

// to avoid accidentally mapping a migration to the wrong value
describe('all migrations are named the same as their key', () => {
  const entries = Object.entries(migrations);
  test.each(entries)('key: %s', (key, migration) => {
    expect(migration.name).toBe(key);
  });
});
