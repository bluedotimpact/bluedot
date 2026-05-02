# CLAUDE.md — apps/website

Website-specific rules for LLM assistants. Read the root `CLAUDE.md` first (coding standards, PR conventions, database workflow, design tokens). For detailed patterns and examples, read `DEVELOPMENT_HANDBOOK.md` (especially §4.1 Frontend Standards).

## Index

- [Deployment guardrails](#deployment-guardrails) — staging vs production, what "merged" means
- [Component architecture guardrails](#component-architecture-guardrails) — self-containment, no prop drilling
- [Implementing UI](#implementing-ui) — text components, design tokens, globals.css, images
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

These are patterns LLMs commonly get wrong in this codebase. See `DEVELOPMENT_HANDBOOK.md` §4.1 for full component standards.

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

---

## Implementing UI

### Match existing styles — don't invent new ones

Always reuse existing components from `@bluedot/ui` and `apps/website/src/components/` rather than building from scratch. Don't invent new styles. Ask the user if they have a Figma mockup or a specific page to reference — or if they'd prefer you to just match the existing website styles.

### Component cheat sheet

Before creating a new component, check `README.md` → "Reusing existing components first" for the full mapping of needs to existing components (`CTALinkOrButton`, `Section`, `HeroSection`, `MarketingHero`, `PageListRow`, etc.).

### Text Components Quick Reference

Import: `import { H1, H2, H3, H4, P, A } from '@bluedot/ui';`
(Also available via `@bluedot/ui/src/Text` if you prefer a direct import.)

| Component | Size | Weight | Use for |
|---|---|---|---|
| `H1`, `H2` | 32-48px | bold | Page/section titles (auto-applies Inter Display) |
| `H3` | 24px | 650 | Subsections |
| `H4` | 18px | 650 | Labels |
| `P` | 16px | normal | Body text |
| `A` | — | — | Links with proper styling |

### Custom text size tokens

Use these instead of Tailwind's default text sizes:

| Token | Size | Note |
|---|---|---|
| `text-size-xxs` | 12px | |
| `text-size-xs` | 14px | |
| `text-size-sm` | 16px | Not the same as Tailwind's `text-sm` |
| `text-size-md` | 18px | |
| `text-size-lg` | 24px | |
| `text-size-xl` | 32-48px | |

### CTALinkOrButton size override

The component applies its own font size per variant (`medium` uses `text-sm`, `small` uses `text-[13px]`), which can override custom text sizes. To force a specific size:

```tsx
<CTALinkOrButton className="text-[16px]">  {/* overrides medium's text-sm */}
<CTALinkOrButton size="small" className="text-[16px]">  {/* overrides small's text-[13px] */}
```

This is the one case where a raw `text-[Xpx]` value is acceptable.

### globals.css scope

`globals.css` is for: CSS reset, base typography, CSS variables, and utilities used site-wide.

Component styles go in the component file via Tailwind — not in `globals.css`, not in separate CSS files, not as inline `style={{}}` props. Exception: if Tailwind genuinely can't express something (e.g. `backgroundBlendMode`), use an inline style with a comment explaining why.

### Styling rules

- Never use `!important` — use Tailwind's `!` prefix only when overriding third-party styles.
- Never specify `font-family` — it's already set globally.
- Prefer `min-h-[Xpx]` over `h-[Xpx]` — let content expand naturally.
- Use `min-width`/`min-height` for flexibility; avoid `max-width`/`max-height` (except `max-w-prose` for readability).

### Figma-to-code

When translating Figma designs: use Tailwind (not inline styles), prefer flexbox/grid over fixed sizes, use `min-h-[Xpx]` instead of `h-[Xpx]`, make it responsive, avoid breakpoints when possible.

### Images

Convert to WebP, target under 200kB. For hero/banner images above the fold, add `{...{ fetchpriority: 'high' }}`. See `DEVELOPMENT_HANDBOOK.md` §4.1 → "Handling Image Assets" for ImageMagick commands and sizing rules.

---

## Comments

Write comments only when the *why* is non-obvious. Don't add "NEW:" or "UPDATED:" markers (version control shows this). When refactoring, remove obvious/outdated comments rather than adding to them. See root `CLAUDE.md` → "Coding rules" for the full rule.

---

## Working with data

- **tRPC**: All new backend endpoints use tRPC routers in `src/server/routers/`. Don't add `pages/api/*` routes unless tRPC genuinely won't fit. See existing routers (e.g., `grants.ts`) for the pattern. Detailed examples in `DEVELOPMENT_HANDBOOK.md` §4.1-4.2.
- **Database / schema changes**: Two-PR workflow — schema change first, consumer code second. Mixing them in one PR breaks staging. Full process in root `CLAUDE.md` → "Database / schema changes", details in `DEVELOPMENT_HANDBOOK.md` §4.3.
- **Testing**: Tests use vitest. Backend router tests use PGlite via `setupTestDb()` from `src/__tests__/dbTestUtils.tsx`. Key utilities: `testDb` for inserting test data, `createCaller()` for server-side tRPC calls, `testAuthContextLoggedIn`/`testAuthContextLoggedOut` for auth fixtures. See `DEVELOPMENT_HANDBOOK.md` §4.2 for the full API. Tests require `.env.local` with at least `AIRTABLE_PERSONAL_ACCESS_TOKEN` — if you don't have credentials, say so in the PR body.

---

<!-- Deployment guardrail intentionally repeated from top of file — this is the highest-consequence mistake an LLM can make in this repo -->

## Preparing a PR

**New pages require a route in `apps/website-proxy/src/nginx.template.conf`** — this is easy to forget and will cause a 404 in staging.

- Run `npm test` from `apps/website/` before opening the PR. See root `CLAUDE.md` → "Before opening a PR" for the full checklist.
- Follow root `CLAUDE.md` → "PR conventions" for commit prefixes, screenshots, and date formats.
- When writing PR descriptions, explain the user-visible impact in plain language before technical details.
- For new components, ask if the user wants a Storybook story (useful for design review or reuse by non-technical team members).
- Remember: merging ships to **staging only**. Production needs a `website/vX.Y.Z` release tag.
