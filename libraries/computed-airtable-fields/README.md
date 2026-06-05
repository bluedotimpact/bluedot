# Computed Airtable fields

This package contains definitions and a framework for calculating "computed" Airtable fields, i.e. values that live in Airtable but are computed from within this codebase (including Postgres-only data).

## Adding a field

1. Add the writable target field in Airtable.
2. Add the target column to `@bluedot/db`.
3. Add a definition in `src/definitions.ts`.
4. I suggest adding a test for the definition function, along the same lines as TODO

Do not point a computed field at an Airtable lookup, rollup, or formula field. The recompute job writes through `PgAirtableDb.update()`, so the target must be writable.
