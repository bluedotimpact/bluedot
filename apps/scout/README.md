# scout

Internal tool for course leads to review recent course participants one at a time and decide whether to invite them to an evaluation call. Deployed at [scout.k8s.bluedot.org](https://scout.k8s.bluedot.org) (admins only — the `Is admin` flag on the users table).

## What it does today

- **Queue**: reads the locked Airtable view `Talent scouting [read by Talent Scouting App]` on Course runner → Course registration. The hard filter (which participants are worth a look) lives in that view, so it can be changed without a deploy.
- **Card**: one person at a time — BlueDot history (every registration, with facilitator opinion), facilitator 1:1 report, project, course feedback, and the application answers. Names are hidden by default (`n` toggles).
- **Keys**: `→` invite · `←` not now · `↓` skip · `↑` back.
- **Writes are off by default.** Invite / Not now only write to Airtable when `SCOUT_WRITES_ENABLED=true` is set. With writes on, Invite sets `1-1 invite source = Talent scouting app` and ticks `[!] Send 1:1 email` (the Course runner automation sends the email), and sets `Talent scouting status`.

There is no AI-generated content in the app yet. Prompts, when they arrive, will live in Airtable, not in this repository.

## Run it locally

1. Follow the [general developer setup](../../README.md#developer-setup-instructions) once (VS Code + dev container).
2. In `apps/scout/.env.local` set `AIRTABLE_PERSONAL_ACCESS_TOKEN` to a personal token with `data.records:read` (and `:write` if you want writes) on the **Course runner** and **Applications** bases. `PG_URL` can stay as the placeholder for now — nothing reads Postgres yet.
3. From `apps/scout`: `npm run start`, then open http://localhost:8000 and log in with your BlueDot account.

## Where things are

- `src/lib/api/airtable.ts` — every Airtable read and write, with field IDs. Start here if a field is wrong or missing.
- `src/lib/client/types.ts` — the shape of a `Person` the card receives.
- `src/components/PersonCard.tsx` — the card. Change this to change what a lead sees.
- `src/pages/index.tsx` — queue, course switcher, keyboard, decisions.
- `src/pages/api/*` — `me`, `queue`, `person/[id]`, `decision`.

## Deployment

Merging to master deploys automatically (standard Next.js app on the k8s cluster).
