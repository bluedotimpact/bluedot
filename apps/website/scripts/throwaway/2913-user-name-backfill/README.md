# User first/last name backfill (#2913)

One-off script to fill the `First name` / `Last name` fields on the Airtable User table from sources that already hold them separately (Keycloak and course applications). It is written to run once before the first/last name PR merges, and once after to catch any stragglers. The user's combined `name` is always preserved if it exists.

## Rules

For each user missing first or last name:

1. Source: the most recent course registration with both names, else Keycloak (`given_name` / `family_name`), matched by Keycloak sub and then by email. Registration wins ties because it's what they asked to be called on the course.
2. If the user has a stored `name`, the source must join to it exactly, ignoring only surrounding and repeated whitespace. Users with no source, or whose stored `name` matches no source, are skipped rather than guessed.
3. First and last name are written from the source. This supersedes the first name that is already in Airtable: `First name` was unused previously and is only set for 45 users (unsure where these come from).

## Running

From `apps/website`, with `.env.local` holding `PG_URL`, `AIRTABLE_PERSONAL_ACCESS_TOKEN`, `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET`:

```bash
# Dry run: prints a summary of what would be written
npx dotenv -e .env.local -- npx tsx scripts/throwaway/2913-user-name-backfill/backfill.ts

# Write to Airtable in batches of 10 at 2.5 req/s (pg-sync-service replicates to Postgres)
npx dotenv -e .env.local -- npx tsx scripts/throwaway/2913-user-name-backfill/backfill.ts --apply
```
