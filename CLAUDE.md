# CLAUDE.md — bluedot monorepo

Guidance for Claude Code (and other LLM assistants) working in this repo. Humans should start with `README.md` and `DEVELOPMENT_HANDBOOK.md`; this file captures the non-obvious rules an assistant needs.

## Read these first

- [`README.md`](./README.md) — repo overview, package structure, dev-container setup
- [`DEVELOPMENT_HANDBOOK.md`](./DEVELOPMENT_HANDBOOK.md) — patterns, tRPC, testing, db migrations
- `apps/<app>/README.md` — app-specific notes; `apps/website/README.md` is especially load-bearing
- When working in a specific app, also read its `CLAUDE.md` if one exists (e.g. `apps/website/CLAUDE.md`).

## Tech stack (one-liner)

TypeScript • Next.js pages router (usually no SSR) • React • Tailwind • zustand • zod • tRPC • vitest • eslint • `@bluedot/ui` • `@bluedot/db` (unified Airtable + Postgres) • Docker on K8s via Pulumi.

We're fans of [boring technology](https://boringtechnology.club/) — don't introduce new dependencies without good reason. If you reach for one, justify it in the PR.

## Set up a worktree before you start

- Always work from a fresh branch in a git worktree — never on `master`, never on a stale branch. `master` drifts hourly, so rebase first:
  ```bash
  cd ~/code/bluedot
  git fetch origin
  git worktree add -b <handle>/<slug> ../bluedot-worktrees/<slug> origin/master
  cd ../bluedot-worktrees/<slug>
  ```
- Copy env files for every app you'll touch: `cp ~/code/bluedot/apps/<app>/.env.local apps/<app>/.env.local`. Don't invent placeholders — ask a teammate if a file is missing.
- If the branch is more than a few hours old when you come back to it, rebase on `origin/master` again before pushing.
- After the PR merges, clean up: from outside the worktree (e.g. `cd ~/code/bluedot`), run `git worktree remove ../bluedot-worktrees/<slug>` and delete the local branch. Add `--force` if you've decided to discard uncommitted local changes; the command refuses to remove a dirty worktree otherwise.

## Before you start a task

- Look for existing components/utilities first. Most marketing primitives already live in `@bluedot/ui` or `apps/website/src/components/`. See `apps/website/README.md` → "Reusing existing components first".
- Use the named `bluedot-*` palette utilities for colour (`text-bluedot-navy`, `bg-bluedot-normal`, including opacity like `text-bluedot-navy/60`) and the size tokens for type (`text-size-md`). Avoid raw hex (`text-[#0037ff]`) **and** the semantic `color-*` tokens (`bg-color-primary-accent`, `border-color-divider`). Exact pixel values like `gap-[3px]` are sometimes ok. Tokens are documented in `apps/storybook/src/GettingStarted.mdx` and defined in `apps/website/src/globals.css`.
- Check existing components in Storybook (`apps/storybook/` or [storybook.k8s.bluedot.org](https://storybook.k8s.bluedot.org)) before building new ones. If a new component would benefit from visual documentation (e.g. for design review or reuse by non-technical team members), ask the user if they'd like a Storybook story.
- For non-trivial work, sketch a plan before editing.

## Coding rules

- All new database access goes through `@bluedot/db`. Don't talk to Airtable or Postgres directly, and don't bypass the abstraction.
- Use Tailwind for new styles. Migrate BEM classes you touch.
- Comments: write them only when the *why* is non-obvious. Don't narrate *what* the code does, and don't reference the current task or PR ("added for issue #123") — that belongs in the PR description.
- Don't add features, abstractions, or error handling beyond what the task requires. Trust internal code; only validate at system boundaries.

## Database / schema changes

`pgAirtable(...)` tables are synced from Airtable by `pg-sync-service`. Always ship schema changes in their own PR before any consumer code:

- **Adding a column**: 2 PRs.
  1. Add the column in `libraries/db/src/schema.ts` and merge. Wait for a sync to finish before merging PR 2.
  2. Then PR the code that uses it.
- **Removing a column**: 2 PRs.
  1. Remove all usage and move the column to `deprecatedColumns` in `libraries/db/src/schema.ts`. If the column used `.notNull()`, remove that first — deprecated columns must be nullable because they stop receiving sync updates. Merge *and* deploy to production.
  2. Then delete it fully from `schema.ts`. Don't delete before production deploy — `pg-sync-service` generates `SELECT` by column name (not `*`), so running code that still references the column will break.
- **Renaming / updating a column**: 3–4 PRs depending on nullability.
  1. Add the new column in `libraries/db/src/schema.ts` and merge. Wait for sync.
  2. Move all application code to the new column.
  3. Move the old column to `deprecatedColumns`. If it used `.notNull()`, you must remove that constraint first — but you can't do that until no code depends on it (removing `.notNull()` changes the type to `T | null`, breaking any code that assumes non-null). Merge and deploy to production.
  4. Delete the old column from `deprecatedColumns`.

Mixing schema additions and consumer code in one PR breaks staging because the table hasn't been materialised yet. Full rules in [`DEVELOPMENT_HANDBOOK.md` — Database Guidelines](./DEVELOPMENT_HANDBOOK.md#43-database-guidelines).

## Before opening a PR

- **Run the app's full test suite** (e.g. `cd apps/website && npm test`). Typecheck and lint do *not* catch test-context regressions — for example, adding a component that calls `useRouter()` to a page covered by an SSR/SEO test will pass typecheck and fail in CI.
- Run lint and typecheck. After changes that touch shared types — especially `@bluedot/db` schema — also run `npx tsc --noEmit` from the workspace root. `npm test` won't catch fixture drift when a schema adds a required property.
- **UI changes — run a viewport sweep.** Use a real browser (headless Playwright is fine) at 390 × 844, 768 × 1024, 1024 × 768, 1280 × 800, 1440 × 900, and 1920 × 1080. At each, check for horizontal scroll, overflowing content, broken sticky/fixed elements, and touch targets <44 px on mobile. Don't trust bounding-box measurements from dev tools — they round and lie about subpixel overflow; eyeball the rendered page. Re-check all four sides after a CSS fix, not just the one you changed. For full-bleed / desktop checks, screenshot at a viewport height of at least 1800 px so above-the-fold + below-the-fold land in one image.
- **Prose surfaces — cap body text at ~65 ch.** For blog posts, course descriptions, about pages, long-form marketing copy, wrap body text in `max-w-prose` (≈65 ch) or `max-w-[70ch]`. Lines longer than ~80 characters are genuinely hard to read (Baymard / WCAG 1.4.8). Doesn't apply to headings, nav, table cells, code blocks, dashboard data, form labels, or hero taglines.
- If you genuinely cannot run tests (e.g. missing credentials), say so loudly in the PR body — don't paper over it.

## PR conventions

- Commit prefix: `[feat]`, `[fix]`, `[style]`, `[chore]`, `[docs]`, `[refactor]`.
- Open a real PR with `gh pr create` — title + body. Don't leave a "create PR" link for the human to fill in.
- **UI screenshots**: embed real `<img>` tags, not text descriptions. Commit screenshots to `.github/pr-screenshots/<n>/` (where `<n>` is the PR number or branch slug), push, then embed via SHA-pinned `raw.githubusercontent.com` URLs (`<img width="390">` for mobile, `<img width="1280">` for desktop). Dismiss any cookie banner before capturing. After embedding, push a follow-up commit deleting the screenshots from `.github/pr-screenshots/` so the folder doesn't grow. The SHA-pinned URLs will still work. If you can't take screenshots, note in the PR body that a human should take them.

## After opening a PR — run the AI review loop

Don't wait for the human to ask. As soon as the PR is open (with screenshots embedded if it's a UI change), run this loop autonomously.

1. Trigger Claude bot: `gh pr comment <N> --body "@claude review"`. Bake it into the same turn as `gh pr create` / `gh pr ready`.
2. Greptile auto-reviews within ~5 min of PR open. Claude bot responds ~1–2 min after the trigger comment. CodeRabbit is rate-limited and often skips — that's fine.
3. Poll for both bots' responses. Pull `comments` **and** `reviews` — GitHub stores them as separate object types and Greptile posts as a review:
   ```bash
   gh pr view <N> --json comments,reviews \
     --jq '[.comments[], .reviews[]] | .[] | select(.author.login != "<your-gh-handle>" and .author.login != "render") | "\(.author.login): \(.body)"'
   ```
4. Categorise every finding:
   - **P1 / critical / scale-inversion-class bugs** → fix in a follow-up commit on the same branch, push.
   - **P2 / dead code / redundant ternary / cleanup** → fix unless the cost is meaningful; bias toward fixing.
   - **Stylistic / nice-to-have** → judge case by case; don't blindly apply.
5. Reply on the PR explaining what you addressed and what you intentionally didn't: `gh pr comment <N> --body "..."`.
6. If you pushed substantive fixes, re-trigger: comment `@claude review` again to get a fresh pass.

If a bot is wrong — they sometimes are — push back politely in a PR reply explaining why. Don't silently ignore, and don't change correct code to appease a bot.

## apps/website specifics

- **Merging to `master` deploys to staging only — it does NOT go to production.** Production requires a GitHub release tagged `website/vX.Y.Z`. See `apps/website/README.md` → Production.
- Dev server: `npm run start` from `apps/website/` → `http://localhost:8000`. Worktrees may use a different port — check terminal output.
- New page = also add the route to `apps/website-proxy/src/nginx.template.conf`.
- Fonts: do **not** delete files from `apps/website/public/fonts/`. 8+ other apps in this repo load them via HTTPS from bluedot.org; deletion silently breaks their typography.

## Dev environment caveats

- The repo is intended to run in a dev container. Don't assume the user has random global tools (e.g. ImageMagick, `gh`, `pulumi`) installed on the host — install inside the container or `brew install` explicitly.
- Airtable is finicky: field names are exact-match, official rate limit is 5 req/s per base (~50 burst), and latency is regularly 500ms+. Plan reads against Postgres, writes through `@bluedot/db`.

## Repo map (quick reference)

- `apps/website` — bluedot.org (Next.js pages router)
- `apps/meet` — meeting attendance + Zoom Web SDK
- `apps/availability` — time-availability forms
- `apps/course-demos` — interactive demos embedded in courses
- `apps/login` — custom Keycloak build
- `apps/website-proxy` — nginx routing for bluedot.org traffic
- `apps/pg-sync-service` — syncs Airtable → Postgres
- `apps/infra` — Pulumi K8s deploy
- `apps/storybook` — design system docs (storybook.k8s.bluedot.org)
- `libraries/ui` — shared React components (`@bluedot/ui`)
- `libraries/db` — unified Airtable + Postgres (`@bluedot/db`)

## When in doubt

Read how existing code does it and follow that pattern. If something feels like it belongs in this file but isn't here, propose adding it in your PR.
