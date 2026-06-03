# Computed Airtable fields

This package recalculates values that live in Airtable but are derived from Postgres-only source tables.

The important property is that each run recomputes from source rows rather than incrementing from previous state. That means a later run corrects stale or incorrect values.

`pg-sync-service` is the production caller. Keep app-layer request paths out of this package unless a future product flow needs immediate read-after-write behavior.

## Adding a field

1. Add the writable target field in Airtable.
2. Add the target column to `@bluedot/db`.
3. Add a definition in `src/definitions.ts`.
4. Add PGlite tests covering the value calculation and unchanged-row skip behavior.

Do not point a computed field at an Airtable lookup, rollup, or formula field. The recompute job writes through `PgAirtableDb.update()`, so the target must be writable.
