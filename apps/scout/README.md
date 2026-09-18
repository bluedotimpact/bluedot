# scout

Internal tool for course leads to review recent course participants one at a time and decide whether to invite them to an evaluation call. Everything on the card is real data read from Airtable; there is no AI in the app yet.

Live at [scout.k8s.bluedot.org](https://scout.k8s.bluedot.org) once merged (admins only — the `Is admin` flag on the Applications users table). While it's being tried out it lives on the branch `eleni/scout-queue` and runs locally.

## Run it locally (about 15 minutes the first time)

1. **Dev container.** If you haven't worked in this repo before, do the one-off setup in the [main README](../../README.md#developer-setup-instructions) (Docker + VS Code, then open the repo in the dev container). If you have, just open the repo in VS Code and reopen in container.
2. **Branch.** In the VS Code terminal:
   ```bash
   git fetch origin && git checkout eleni/scout-queue && npm install
   ```
   To make changes, branch off it: `git checkout -b <yourname>/scout-<topic>` and open a PR back into `eleni/scout-queue`.
3. **Airtable token.** Create a personal access token at https://airtable.com/create/tokens with scopes `data.records:read`, `data.records:write`, `schema.bases:read` and access to the **Course runner** and **Applications** bases. Put it in `apps/scout/.env.local`:
   ```
   AIRTABLE_PERSONAL_ACCESS_TOKEN=pat…
   ```
   (`npm install` creates `.env.local` from the template; the other values can stay as they are. `PG_URL` is unused for now.)
4. **Run.**
   ```bash
   cd apps/scout && npm run start
   ```
   Open http://localhost:8000 and log in with your BlueDot account.

If edits made outside the container don't show up, add `WATCHPACK_POLLING=true` to `.env.local` and restart.

## How to use it

- Pick a course at the top. The queue is the locked Airtable view **Talent scouting [read by Talent Scouting App]** on Course runner › Course registration — the hard filter (who is worth a look) lives there and can be changed in Airtable without touching code. Most recently ended round first, strong yes first within a round.
- One person per screen. Names are hidden by default — `n` shows them.
- **With BlueDot** is open by default: every registration for that email, grants and evaluation calls. Other sections open on click; empty ones are greyed.
- Keys: `→` Invite · `←` Don't invite · `↓` skip · `n` name.
- **Invite and Don't invite are notes kept in your browser.** Nothing reaches Airtable. At the end of the queue you get the list of people you'd invite, with a copy button.
- **Invite for real…** is the only action that writes. It asks for confirmation, then sets `1-1 invite source = Talent scouting app`, ticks `[!] Send 1:1 email` and sets `Talent scouting status = Invited` on the Course runner registration. The existing Course runner automation sends the invite email from the course lead and stamps the invite date. The server re-reads the row first and refuses if the person was already contacted. Your Airtable token needs write access for this.

## Where things are

- `src/lib/api/airtable.ts` — every read and the one write, with Airtable field IDs. Start here if a field is wrong or missing.
- `src/lib/client/types.ts` — the shape of a `Person` the card receives.
- `src/components/PersonCard.tsx` — the card. Change this to change what a lead sees.
- `src/pages/index.tsx` — queue, course switcher, keyboard, notes, invite-for-real dialog.
- `src/pages/api/` — `me` (access), `queue`, `person/[id]`, `invite`.

## What's deliberately not here yet

- Any model-generated text. When it comes, prompts will live in an Airtable table (this repository is public), the model will be called from the server, and the output cached per person. Course leads: drafts of the core prompt and your course prompt are the most useful thing you can prepare.
- Reading via `@bluedot/db` for the tables Postgres already has (registrations, rounds, project submissions, course feedback). Several fields this app needs are not synced, so everything goes through the Airtable API for now.

## Deployment

Merging to master deploys automatically (standard Next.js app on the k8s cluster). Not merged yet on purpose.
