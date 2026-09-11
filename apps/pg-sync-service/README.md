# pg-sync-service

Service that listens for changes in Airtable via webhooks to keep a PostgreSQL read replica up to date.

## Usage

```bash
# Start the service
npm run start

# Start with initial full sync
npm run start -- --initial-sync

# Start with initial sync for specific tables only, using postgres table names
npm run start -- --initial-sync-tables course person user
```

## How it works

1. **Webhooks**: Creates [Airtable webhooks](https://airtable.com/developers/web/api/webhooks-overview) for each base and polls them for changes
2. **Initial sync**: When started with `--initial-sync`, or when no sync has occurred in the last 24 hours, performs a full scan of each table to sync existing data. Use `--initial-sync-tables` to limit initial sync to specific postgres tables while keeping all webhook syncing active, this is useful for testing schema changes in development.
3. **Ongoing sync**: Continuously polls webhooks and replicates changes to PostgreSQL using the `@bluedot/db` library

## Other things it does

The service is also the home for background jobs that need Airtable and Postgres access. None of these affect syncing: each one catches its own errors and reports them to Slack or Sentry.

- **Computed Airtable fields** (every 2h): recomputes the fields defined in [`libraries/computed-airtable-fields`](../../libraries/computed-airtable-fields) and writes them back to Airtable.
- **PostHog events** (every 30min): derives analytics events from Postgres state via [`libraries/computed-posthog-events`](../../libraries/computed-posthog-events) and forwards them to PostHog.
- **Sentry heartbeat** (every minute): check-in for the `pg-sync-heartbeat` monitor, so Sentry alerts if the service stops.
- **Field usage markers** (on startup, production only): adds `Consider deletion on: Never (used in code)` to the Airtable description of every field referenced in `libraries/db/src/schema.ts`.
