# User first/last name backfill (#2913)

One-off script to fill the `First name` / `Last name` fields on the Airtable User table from sources that already hold them separately (Keycloak and course applications). It is written to run once before the first/last name PR merges, and once after to catch any stragglers. The user's combined `name` is always preserved if it exists.

## Rules

For each user, the target is a first and last name that join to `name` exactly. Users whose stored fields already match are skipped; otherwise whichever of the three fields differ are written.

1. If `name` is set, take the first/last name from a source that joins to `name` (ignoring only surrounding and repeated whitespace), else split `name`.
   - Sources, in order: the most recent course registration with both names, then Keycloak (`given_name` / `family_name`, matched by Keycloak sub and then by email).
   - Split: Split on the first space, matching the existing rule from `facilitator-applications.ts`. If there is an existing first name, split on that instead.
2. If `name` is blank, take the first source available, else the existing first/last name, and write `name` as its join. Users with none of these are skipped.
3. An existing first/last name that disagrees with the target is never overwritten: the user is skipped and listed for manual review. About 13,600 users had a `First name` (mostly the first word of `name`, no last name) from before this codebase; a few dozen hold nicknames or junk that don't fit the name.

## Running

From `apps/website`, with `.env.local` holding `PG_URL`, `AIRTABLE_PERSONAL_ACCESS_TOKEN`, `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET`:

```bash
# Dry run: prints a summary of what would be written
npx dotenv -e .env.local -- npx tsx scripts/throwaway/2913-user-name-backfill/backfill.ts

# Write to Airtable in batches of 10 at 2.5 req/s (pg-sync-service replicates to Postgres)
npx dotenv -e .env.local -- npx tsx scripts/throwaway/2913-user-name-backfill/backfill.ts --apply
```
