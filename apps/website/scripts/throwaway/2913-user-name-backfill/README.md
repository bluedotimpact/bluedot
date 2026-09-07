# User first/last name backfill (#2913)

One-off script to fill the `First name` / `Last name` fields on the Airtable User table from sources that already hold them separately (Keycloak and course applications). It is written to run once before the first/last name PR merges, and once after to catch any stragglers. The user's combined `name` is always preserved if it exists.

## Rules

For each user, the target is a first and last name that join to `name` exactly. Users whose stored fields already match are skipped; otherwise whichever of the three fields differ are written.

1. If `name` is set: take the first/last name from the most recent course registration with both names, else from Keycloak (`given_name` / `family_name`, matched by Keycloak sub and then by email), provided it joins to `name` ignoring only surrounding and repeated whitespace. Registration wins ties because it's what they asked to be called on the course. If no source matches, split `name` on the first space (a single word becomes the first name with an empty last name). This is the same split the facilitator application form has always used to pre-fill its fields.
2. If `name` is blank: take the first source available, else the existing first/last name, and write `name` as its join. Users with none of these are skipped.
3. An existing first/last name that doesn't match the target is overwritten. `First name` was unused previously and is only set for 45 users (unsure where these come from).

## Running

From `apps/website`, with `.env.local` holding `PG_URL`, `AIRTABLE_PERSONAL_ACCESS_TOKEN`, `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET`:

```bash
# Dry run: prints a summary of what would be written
npx dotenv -e .env.local -- npx tsx scripts/throwaway/2913-user-name-backfill/backfill.ts

# Write to Airtable in batches of 10 at 2.5 req/s (pg-sync-service replicates to Postgres)
npx dotenv -e .env.local -- npx tsx scripts/throwaway/2913-user-name-backfill/backfill.ts --apply
```
