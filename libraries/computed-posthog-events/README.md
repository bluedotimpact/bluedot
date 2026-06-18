# Computed PostHog events

This package derives analytics events (e.g. `application_submitted`, `application_accepted`, `certificate_issued`) from Postgres state and forwards them to PostHog. Events are a pure projection of the data and are sent idempotently, so the job can run on a schedule without producing duplicates.

The job runs in `pg-sync-service` (`forwardAllEventsToPostHogCron`), which calls `forwardEventTypeToPostHog` once per rule on a cron.

## How it works

- Each `EventProjectionRule` in `src/definitions.ts` derives a list of events from the current Postgres state, optionally filtered by a `since` timestamp for incremental runs.
- Every emitted event is logged in the `posthog_emitted_events` table (`@bluedot/db`), keyed by event name + `internalUniqueKey`. Each run filters against that log, so an event is sent at most once even though the projection recomputes the full set.
- Events older than 48h are sent with PostHog's `historical_migration` flag; recent ones are sent live.
- A rule may also emit an `$identify` event to merge a captured anonymous PostHog id into the applicant's email-keyed person, attributing their pre-application browsing to them.

## Adding an event

1. Add an `EventProjectionRule` in `src/definitions.ts` — an `eventType` plus a `calculateEvents` that reads from `@bluedot/db` and returns the events.
2. Add a test in `src/definitions.test.ts`.
