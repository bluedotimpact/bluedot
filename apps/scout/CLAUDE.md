# CLAUDE.md — apps/scout

Read the root `CLAUDE.md` first (worktree, lint rules, tokens, PR conventions). This file covers what is specific to scout.

## What this app is

An internal review tool for course leads: one course participant per screen, real data from Airtable, a decision per person. It exists to surface people who finished (or nearly finished) a course and were never invited to an evaluation call. Users are BlueDot staff with the `Is admin` flag; there is no public surface.

## Map

- `src/lib/api/airtable.ts` — every Airtable read and the single write, with field IDs grouped by table (`REG`, `ROUND`, `REPORT`, `PROJECT`, `FEEDBACK`, `PEER`, `GRANT`, `CALL`, `APP`, `USER`). Field IDs, not names, everywhere. If a field is missing on the card, it is added here first, then to the type, then to the card.
- `src/lib/client/types.ts` — the `Person` shape the card receives and the smaller types it is built from.
- `src/components/PersonCard.tsx` — the card. Sections in a fixed order; empty sections render greyed, never hidden (except the 1:1 report and project notes, which appear only when present). One `Disclosure` component is the only collapsible affordance. Badge colours for Airtable single/multi selects mirror Airtable's own palette via `AIRTABLE`/`*_COLOUR` maps.
- `src/pages/index.tsx` — queue, course switcher, keyboard, people cache with one-ahead prefetch, the confirm dialog both decisions go through.
- `src/pages/api/` — `me` (access), `queue` (the locked view), `person/[id]`, `decision` (the only write).

## Rules that are not obvious from the code

- **The queue is the Airtable view, in the view's order.** Do not add filtering or sorting in code; course leads control both in Airtable without a deploy. The view id is `QUEUE_VIEW_ID`.
- **One write path.** `inviteForReal` / `declineForReal` in `airtable.ts`, reached only from `/api/decision` with a fresh (uncached) admin check. Both re-read the row first and refuse anyone with an invite date, a sent flag, the send box ticked, or a status. Both are irreversible from the app, so the UI always confirms first — never let a keystroke write without the dialog. Do not add other writes without discussing it with the course engineer.
- **No prompts, model calls or AI-generated text in this repository.** It is public. When the AI layer arrives, prompts live in an Airtable table, the model is called server-side, and outputs are cached per person. Until then, anything labelled "AI" on the card is the speed-review output that already exists on the application record.
- **Reads go through the Airtable REST API, not `@bluedot/db`**, because several fields this app needs (`Talent scouting status`, invite fields, Facilitator 1:1 reports, Peer feedback) are not synced to Postgres. Moving the tables that are synced onto `db.scan` is a known follow-up, not something to do in passing.
- `fetchOne` fetches whole records: the single-record endpoint rejects `fields[]`.
- Lint enforces design-system tokens (`text-size-*`, role colours). Airtable's badge colours are the one deliberate exception, applied as inline styles.
- The dev server inside the container does not see file changes made from the host; `WATCHPACK_POLLING=true` in `.env.local` fixes that.

## Decisions already made (don't reopen in code)

- A person is considered once per registration, after the round has ended. No mid-course review, no second pass yet.
- Completion is not required for someone to appear; the view decides what human signal is enough.
- People who already had an evaluation call or a grant application are shown with a flag, not excluded.
- Names are hidden by default while judging (`n` shows them).

## Verifying

`npm run lint` and `npm run typecheck` from `apps/scout` (inside the dev container). Then run it and page through a few people — the checks cannot see whether a field renders as intended.

## Practicalities for an assistant

- **Node only exists inside the dev container.** Run `npm` there (VS Code terminal, or `docker exec` into the container). Git runs fine from either side.
- **Never test Invite or Don't invite on a real person** — Invite emails them and neither can be undone from the app. Ask the course engineer for a test registration first, or verify the write path read-only (fetch the row, check the guard fields) as `inviteForReal` does.
- **Finding a field ID**: the Airtable meta API lists every table and field for a base, using the same token as `.env.local`:
  `curl -s -H "Authorization: Bearer $AIRTABLE_PERSONAL_ACCESS_TOKEN" https://api.airtable.com/v0/meta/bases/appPs3sb9BrYZN69z/tables` (Course runner; Applications is `appnJbsG1eWbAdEvf`). Use IDs, never names, in code; a renamed field must not break the app.
- **Airtable rate limit is 5 requests/second per base.** Loading one person already makes ~6 parallel requests. Do not add anything that fetches every person in the queue, or loops over linked records beyond the current card.
- **The queue view is locked.** Changing who appears or the order is an Airtable change by the course engineer, not a code change.
- `.env.local` is git-ignored and holds a personal token — never commit it, never print its contents.
- **Prompt drafts go in Notion, not here.** The repository is public; see "No prompts" above.
- Branch off `eleni/scout-queue`, keep PRs small, open them against that branch, and comment `@claude review` on each (root `CLAUDE.md` describes the review loop).
