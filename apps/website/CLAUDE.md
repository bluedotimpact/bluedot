# CLAUDE.md — apps/website

Website-specific rules for LLM assistants. Read the root `CLAUDE.md` first (coding standards, PR conventions, database workflow, design tokens). For detailed patterns and examples, read [`DEVELOPMENT_HANDBOOK.md` — Frontend Standards](../../DEVELOPMENT_HANDBOOK.md#41-frontend-standards).

## Index

- [Deployment guardrails](#deployment-guardrails) — staging vs production, what "merged" means
- [Component architecture guardrails](#component-architecture-guardrails) — self-containment, no prop drilling
- [Implementing UI](#implementing-ui) — existing styles, globals.css, images
- [Comments](#comments) — when and how to comment
- [Working with data](#working-with-data) — tRPC, schema changes, testing
- [Preparing a PR](#preparing-a-pr) — test, nginx route, deploy reminders

---

## Deployment guardrails

**Merging to `master` deploys to staging only. It does NOT deploy to production.**

Production requires a GitHub release tagged `website/vX.Y.Z`. See `README.md` → Deployment for the full process.

Never tell the user a change is "deployed" or "live" after merging. Always specify which environment. Merging deploys to staging only. Production requires a tagged release.

- Staging: https://website-staging.k8s.bluedot.org/
- Production: https://bluedot.org/

---

## Component architecture guardrails

These are patterns LLMs commonly get wrong in this codebase. See [`DEVELOPMENT_HANDBOOK.md` — Frontend Standards](../../DEVELOPMENT_HANDBOOK.md#41-frontend-standards) for full component standards.

**Self-contained components**: Components determine their own state. Don't pass props the child could derive itself.

```tsx
// DON'T — parent knows too much about child's needs
// _app.tsx
<Nav className={router.pathname === '/' ? 'homepage-nav' : ''} />

// DO — child owns its own logic
// Nav.tsx
const router = useRouter();
const isHomepage = router.pathname === '/';
```

**No prop drilling**: If a child can determine a value itself (via `useRouter()`, a store, or a hook), don't pass it from the parent.

**Component-owned logic**: Keep component-specific logic inside the component, not in utils files. `utils.ts` is for truly generic, reusable utilities only.

**No duplicate logic**: Don't check the same condition in multiple components. If both parent and child check `router.pathname === '/'`, one of them shouldn't be.

**File structure**: Imports → Types/Interfaces → Constants → Main Component (exported here, not at the bottom) → Helper functions. Keep sub-components in the same file unless genuinely reusable elsewhere.

### Code quality

- Use semantic names: `activeUserItems` not `temp`, `hasActiveItems` not `flag`.
- Extract repeated logic into well-named functions or components.
- Avoid `!important` in CSS — use Tailwind's `!` prefix only when overriding third-party styles.

---

## Implementing UI

### Match existing styles — don't invent new ones

Follow root `CLAUDE.md` → "Before you start a task" for shared components and tokens. Website-local components are listed in `README.md` → "Reusing existing components first". Typography (`H1`–`H4`, `P`, `HeroH1`, size, leading and tracking tokens) is documented in `apps/storybook/src/GettingStarted.mdx`. Ask the user if they have a Figma mockup or a specific page to reference — or if they'd prefer you to just match the existing website styles.

### globals.css scope

`globals.css` is for: CSS reset, base typography, CSS variables, and utilities used site-wide.

Component styles go in the component file via Tailwind — not in `globals.css`, not in separate CSS files, not as inline `style={{}}` props. Exception: if Tailwind genuinely can't express something (e.g. `backgroundBlendMode`), use an inline style with a comment explaining why.

### Styling rules

- Never specify `font-family` — it's already set globally.
- Prefer `min-h-[Xpx]` over `h-[Xpx]` — let content expand naturally.
- Use `min-width`/`min-height` for flexibility; avoid `max-width`/`max-height` (except `max-w-prose` for readability).

### Figma-to-code

When translating Figma designs: use Tailwind (not inline styles), prefer flexbox/grid over fixed sizes, use `min-h-[Xpx]` instead of `h-[Xpx]`, make it responsive, avoid breakpoints when possible.

### Images

Convert to WebP, target under 200kB. For hero/banner images above the fold, add `{...{ fetchpriority: 'high' }}`. See [`DEVELOPMENT_HANDBOOK.md` — Handling Image Assets](../../DEVELOPMENT_HANDBOOK.md#handling-image-assets) for ImageMagick commands and sizing rules.

---

## Comments

Write comments only when the *why* is non-obvious. Don't add "NEW:" or "UPDATED:" markers (version control shows this). When refactoring, remove obvious/outdated comments rather than adding to them. See root `CLAUDE.md` → "Coding rules" for the full rule.

---

## Working with data

- **tRPC**: All new backend endpoints use tRPC routers in `src/server/routers/`. Don't add `pages/api/*` routes unless tRPC genuinely won't fit. See existing routers (e.g., `grants.ts`) for the pattern. Detailed examples in [`DEVELOPMENT_HANDBOOK.md` — Frontend](../../DEVELOPMENT_HANDBOOK.md#41-frontend-standards) and [Backend Standards](../../DEVELOPMENT_HANDBOOK.md#42-backend-standards).
- **Database / schema changes**: Two-PR workflow — schema change first, consumer code second. Mixing them in one PR breaks staging. Full process in root `CLAUDE.md` → "Database / schema changes", details in [`DEVELOPMENT_HANDBOOK.md` — Database Guidelines](../../DEVELOPMENT_HANDBOOK.md#43-database-guidelines).
- **Testing**: Tests use vitest. Backend router tests use PGlite via `setupTestDb()` from `src/__tests__/dbTestUtils.tsx`. Key utilities: `testDb` for inserting test data, `createCaller()` for server-side tRPC calls, `testAuthContextLoggedIn`/`testAuthContextLoggedOut` for auth fixtures. See [`DEVELOPMENT_HANDBOOK.md` — Backend Standards](../../DEVELOPMENT_HANDBOOK.md#42-backend-standards) for the full API. Tests require `.env.local` with at least `AIRTABLE_PERSONAL_ACCESS_TOKEN` — if you don't have credentials, say so in the PR body.
- **User impersonation**: It is often useful during development to test with users that have data relevant to the thing being built. `/?impersonate=<email>` switches the current session to view the site as that user (needs an admin logged in session already, server-enforced). `?impersonate=clear` reverses it. See `src/components/admin/ImpersonationBadge.tsx` for more info.

---

<!-- Deployment guardrail intentionally repeated from top of file — this is the highest-consequence mistake an LLM can make in this repo -->

## Preparing a PR

**New pages require a route in `apps/website-proxy/src/nginx.template.conf`** — this is easy to forget and will cause a 404 in staging.

- Run `npm test` from `apps/website/` before opening the PR. See root `CLAUDE.md` → "Before opening a PR" for the full checklist.
- Follow root `CLAUDE.md` → "PR conventions" for commit prefixes, screenshots, and date formats.
- When writing PR descriptions, explain the user-visible impact in plain language before technical details.
- For new user-facing components, add a Storybook story alongside (see root `CLAUDE.md` → "Before you start a task" for the full add/modify/remove sync rule).
- Remember: merging ships to **staging only**. Production needs a `website/vX.Y.Z` release tag.
