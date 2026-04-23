# Bluedot Development Handbook

## Executive Summary

This handbook consolidates development patterns and helps new team members transition smoothly. Our tech stack includes:

- **Frontend**: Next.js (Pages Router), React, Tailwind CSS, tRPC (data fetching)
- **Backend**: tRPC routers, Airtable (source of truth), PostgreSQL (read replica)
- **Authentication**: Keycloak
- **Deployment**: Pulumi, Kubernetes, nginx

### Quick Start Checklist
- [ ] Request Airtable access and create personal access token
- [ ] Get production PG_URL from a Bluedot team member (if needed — template has a localhost default)
- [ ] Set up local development environment
- [ ] Be aware of Component Library in `libraries/ui` - reuse these components whenever possible
- [ ] Read Section 4: Development Standards

---

## 1. Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Getting Started](#3-getting-started)
4. [Development Standards](#4-development-standards)
   - 4.1 [Frontend Standards](#41-frontend-standards)
   - 4.2 [Backend Standards](#42-backend-standards)
   - 4.3 [Database Guidelines](#43-database-guidelines)
5. [Component Library](#5-component-library)
6. [Deployment & DevOps](#6-deployment--devops)
7. [Appendices](#7-appendices)

---

## 2. Architecture Overview

### System Architecture

```
╔═════════════╗     ╔═════════════╗     ╔═════════════╗
║   Browser   ║────►║   Next.js   ║────►║  Airtable   ║
║             ║     ║   Website   ║     ║   (Write)   ║
╚═════════════╝     ╚══════╤══════╝     ╚══════╤══════╝
                           │                   │
                           ▼                   ▼
                    ╔═════════════╗     ╔═════════════╗
                    ║ PostgreSQL  ║◄────║ Replication ║
                    ║   (Read)    ║     ║   Service   ║
                    ╚═════════════╝     ╚═════════════╝
```

### Key Components

- **apps/website**: Main user-facing application (what users see when visiting bluedot.org)
- **libraries/ui**: Shared React components following Bluedot branding
- **apps/storybook**: Component documentation and visual testing
- **apps/login**: Keycloak integration

### Why Two Databases?

- **Airtable (Source of Truth)**:
  - Excellent CRM for technical and non-technical users
  - Easy to explore, visualize, and build automations
  - Handles reliability and uptime for us
  
- **PostgreSQL (Read Replica)**:
  - Solves Airtable's performance limitations (500ms+ latency)
  - No rate limiting issues
  - Enables faster page loads

**Important**: Reads go to PostgreSQL, writes go to Airtable, and only afterwards go to PostgreSQL

---

## 3. Getting Started

### Prerequisites Checklist

- [ ] Node.js installed
- [ ] npm configured
- [ ] Git access to bluedot repository
- [ ] Airtable account with API access (request this)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bluedotimpact/bluedot.git
   cd bluedot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the template
   cp apps/website/.env.local.template apps/website/.env.local
   # Then fill in your values
   ```

   The `.env.local.template` file is the source of truth for all environment variables. Most have sensible defaults for local development. You only need to fill in:

   | Variable | How to get it |
   |----------|---------------|
   | `AIRTABLE_PERSONAL_ACCESS_TOKEN` | Create a personal access token in Airtable |

   `PG_URL` has a localhost default in the template. To use production data instead, get the production connection string from a Bluedot team member. 

   **Conditionally required** (only if working on specific features):

   | Variable | When needed |
   |----------|-------------|
   | `KEYCLOAK_CLIENT_ID` / `KEYCLOAK_CLIENT_SECRET` | Account settings page |
   | `LUMA_API_KEY` | Luma events integration |

   Everything else (`ALERTS_SLACK_*`, `NEXT_PUBLIC_*`, `APP_NAME`, etc.) has working defaults in the template.

4. **Configure Airtable Access**
   - Request access to production Airtable base
   - Create personal access token with appropriate permissions
   - See the Slack channel for contractors for detailed setup instructions

5. **Run development server**
   ```bash
   cd apps/website
   npm run dev
   ```

### Common Issues & Solutions

#### Airtable Performance (FYI)
**Context**: 
- Official limit: 5 req/s per base
- Unofficial: Can burst to 50 req/s for short periods
- High latency: frequently 500ms+ per request
- Note: This is informational - no specific action required

#### Debugging React Components
**Tip**: If you're having trouble finding React components in the browser inspector, install the React Developer Tools Chrome extension: https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en

---

## 4. Development Standards

### 4.1 Frontend Standards

#### When to Create Components vs Pages (Next.js)

**General idea**: If a page needs to hold state, consider separating that component out and calling that new component from the page.

**What Pages Should Do**:
* **SEO stuff**: Next.js `<Head>`: title, metadata and JSON-LD schemas
* **API calls**: It's fine to need these
* **Conditional rendering**: At most, render different components based on an API call

**When to Make a New Component:**
* When you need to manage state
* When things get complex
* When you might reuse it somewhere else

| Scenario | Page | Component | Explanation |
|----------|------|-----------|-------------|
| Needs SEO (e.g., `<Head>`, metadata, JSON-LD) | Yes | No | SEO logic belongs at the page level in frameworks like Next.js |
| Is linked to via routing (e.g., /dashboard, /profile) | Yes | No | Pages represent routes in the application (especially in file-based routing) |
| Makes API calls | Yes | Yes | Both pages and components may encapsulate API calls. Pages may switch between components based on API responses |
| Needs to manage its own local state | No | Yes | Create a component if it manages state internally |
| Is getting large or complex | No | Yes | Break it into a component for better readability and maintainability |
| Might be reused elsewhere in the app | No | Yes | Reusable UI logic or elements should live in components |

**Rule of thumb**: Pages should orchestrate and compose components. Components should encapsulate behavior, state, and reusable UI.

#### Component Organization

- Keep everything in same file unless obviously reusable
- Prefer a single default export (the topmost component) where practical
- Topmost component handles orchestration
- Sub-components should be self-reliant (handle own API calls and logic)
- Named exports for types used by other files are fine

#### Data Fetching with tRPC

All data fetching uses tRPC (`import { trpc } from 'src/utils/trpc'` — use the appropriate relative path for your file). tRPC provides end-to-end type safety from backend to frontend with no manual schema parsing needed.

**Queries** (reading data):
```tsx
const { data, isLoading, error } = trpc.courses.getBySlug.useQuery({ courseSlug });

// Render pattern
if (isLoading) return <ProgressDots />;
if (error) return <ErrorSection error={error} />;
return <CourseContent data={data} />;
```

**Mutations** (writing data):
```tsx
const mutation = trpc.users.changePassword.useMutation();

mutation.mutate(
  { currentPassword, newPassword },
  {
    onSuccess() {
      // handle success (e.g., close modal, show success message)
    },
    onError(err) {
      if (err instanceof TRPCClientError) {
        if (err.data?.code === 'UNAUTHORIZED') {
          setError('Incorrect password');
        } else if (err.data?.code === 'BAD_REQUEST') {
          setError(err.message || 'Invalid input');
        } else {
          setError(`Failed: ${err.message || 'Please try again.'}`);
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    },
    onSettled() {
      setIsLoading(false);
    },
  },
);
```

See `src/components/settings/PasswordSection.tsx` for a complete real-world example.

#### Error Handling

Errors are handled inline per component using tRPC error codes. There is no centralized toast system — each component manages its own error UI with local state.

**Pattern**:
- Use `useState` for field-level error strings
- Check `err instanceof TRPCClientError` in `onError` callbacks
- Map tRPC error codes (`UNAUTHORIZED`, `BAD_REQUEST`, etc.) to user-friendly messages
- Use `aria-invalid`, `aria-live="polite"`, and `role="alert"` for accessibility

#### Styling Guidelines

**Use Tailwind CSS for all new code.**

Legacy BEM-style class names (e.g., `culture-section__container`, `announcement-banner__label`) still exist in parts of the codebase. When touching files with BEM classes, migrate them to Tailwind.

```tsx
// Correct — Tailwind with accessibility
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <label className="text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input 
    type="email"
    aria-label="Email Address"
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  />
  <button 
    aria-label="Save email changes"
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Save
  </button>
</div>

// Don't use BEM
<div className="profile-account-details__title">
  <input className="profile-account-details__input" />
</div>
```

The `aria-label` attributes make elements easily selectable in tests using React Testing Library.

#### Handling Image Assets

Images are kept in the codebase with manual optimisation rather than `next/image`. The site isn't very image-heavy, so this keeps things simple.

**Airtable attachment images**: Some images are served directly from Airtable attachment fields rather than stored in the codebase. Examples include testimonial headshots (`headshotAttachmentUrls` field) and team member photos (`imagePublicUrls` field). Routers extract the first URL using helper functions like `getFirstHeadshotUrl()` — see `src/server/routers/testimonials.ts` for the pattern.

**Static content images**: For images referenced from Airtable data fields but stored locally, place them under `public/images/content/`. This signals to devs to be more careful about deleting those images, as they might be referenced elsewhere.

**How to optimize images:**

Generally aim to get all images under 200kB.

1. **Convert to WebP** using ImageMagick:
   ```bash
   magick input.png -quality 85 output.webp
   ```

2. **If still over 200KB**, resize to 2x the maximum rendered width:
   ```bash
   magick input.png -resize WIDTHx -quality 85 output.webp
   ```
   For example, if an image displays at max 400px wide, use `-resize 800x`.

3. **Update references** in code to use the new `.webp` filename and delete the old version.

4. **(Optional) For hero/banner images** that appear above the fold, add `{...{ fetchpriority: 'high' }}` to the `<img>` tag to improve Largest Contentful Paint. Don't do this if the image doesn't appear above the fold.

If you don't have ImageMagick installed, run `brew install imagemagick` on mac.

#### Testing Standards

**Testing Philosophy**: Follow React Testing Library best practices — "The more your tests resemble the way your software is used, the more confidence they can give you."

**Component Accessibility Checklist**

The following practices make components easily testable:

- [ ] All interactive elements have unique accessible names (text or aria-label)
- [ ] Generic actions include context ("Delete" → aria-label="Delete user John")
- [ ] Form inputs have unique labels ("Name" → "Billing Name")
- [ ] Repeated elements in loops include identifying data in aria-labels
- [ ] Icon-only buttons have descriptive aria-labels
- [ ] Links use descriptive text, not "click here"
- [ ] Use semantic HTML (button, nav, main) over generic divs

**Testing Query Priority (Simplified)**

When writing tests, use queries in this order:

1. **getByRole** - Your first choice for almost everything (with name option)
2. **getByLabelText** - Best for form fields
3. **getByPlaceholderText** - If no label is available
4. **getByText** - For non-interactive elements (divs, spans, paragraphs)
5. **getByDisplayValue** - For filled-in form values

Avoid `getByTestId` and `querySelector` — they don't reflect user behavior.

Full details: https://testing-library.com/docs/queries/about/#priority

**Consider for Every Component**:

Snapshot tests catch visual regressions, functional tests confirm behavior.

1. **Snapshot Test** — Full output snapshot of default render
2. **Functional Tests** — Test complete user flows, mock API responses, verify UI updates from the user's perspective

### 4.2 Backend Standards

#### tRPC Router Architecture

All backend logic lives in tRPC routers at `src/server/routers/`. Routers are aggregated in `src/server/routers/_app.ts`.

**Procedure types** (defined in `src/server/trpc.ts`):
- `publicProcedure` — No authentication required
- `protectedProcedure` — Requires authenticated user; `ctx.auth` contains `{ email, sub, iss, aud, exp, email_verified }`
- `adminProcedure` — Requires admin access (checks `isAdmin` flag on user record)

For the full auth context shape, see `src/server/context.ts`.

When adding a new router: create the file in `src/server/routers/`, then register it in `_app.ts`. Look at existing routers for patterns — they cover reads, writes, auth context usage, and error handling.

**Example router** (from `src/server/routers/grants.ts`):
```typescript
import { grantTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const grantsRouter = router({
  getAllPublicGrantees: publicProcedure.query(async () => {
    const all = await db.scan(grantTable);
    return mapPublicGrants(all);
  }),
});
```

**With input validation** (from `src/server/routers/testimonials.ts`):
```typescript
import { z } from 'zod';

getCommunityMembersByCourseSlug: publicProcedure
  .input(z.object({ courseSlug: z.string() }))
  .query(async ({ input }) => {
    const all = await db.scan(testimonialTable);
    return all.filter((t) => t.displayOnCourseSlugs?.includes(input.courseSlug));
  }),
```

Input validation uses inline Zod schemas on each procedure. tRPC automatically provides type safety to the frontend — no separate shared schema files needed.

#### Non-tRPC API Routes

A few special-purpose Next.js API routes remain in `src/pages/api/` for integrations that don't fit the tRPC model:
- `calendar/discussions/[discussionId].ts`
- `keycloak-register-preview-redirect-uri.ts`
- `report-client-error.ts`
- `site-login.ts`

All new backend endpoints should be tRPC routers.

#### Testing Backend with PGlite

Backend tests use PGlite to run an in-memory PostgreSQL database. This allows testing tRPC routers against a real database without external services.

**Setup utilities** are in `libraries/db/src/lib/test-db.ts`:
- `createTestPgClient()` — Creates an in-memory PGlite-backed Drizzle client
- `pushTestSchema(db)` — Initializes database tables
- `resetTestDb(db)` — Truncates all tables for test isolation

**Test helpers** for the website app are in `src/__tests__/dbTestUtils.tsx`:
- `setupTestDb()` — Calls `pushTestSchema` in `beforeAll` and `resetTestDb` in `beforeEach`
- `testDb` — Test database instance that allows explicit ID insertion
- `createCaller(ctx)` — Server-side tRPC caller for router tests (defaults to unauthenticated; pass `testAuthContextLoggedIn` for authenticated calls)
- `testAuthContextLoggedIn` / `testAuthContextLoggedOut` — Pre-built auth context fixtures
- `createTrpcDbProvider(ctx)` — React provider using `localLink` for component tests

**Example** (see full version at `src/server/routers/grants.test.ts`):
```typescript
import { describe, expect, test } from 'vitest';
import { grantTable } from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('grants.getAllPublicGrantees', () => {
  test('filters incomplete rows, trims fields, sanitizes links, and sorts by project title', async () => {
    await testDb.insert(grantTable, {
      granteeName: '  Alice  ', projectTitle: '  Zebra Project ',
      amountUsd: 5000, projectSummary: '  Useful work  ', link: ' https://example.com/zebra ',
    });
    await testDb.insert(grantTable, {
      granteeName: 'Bob', projectTitle: 'Alpha Project',
      amountUsd: null, projectSummary: '', link: '   ',
    });
    // ... more inserts testing edge cases (blank names, unsafe links, etc.)

    const caller = createCaller();
    const result = await caller.grants.getAllPublicGrantees();

    expect(result).toEqual([
      // Results are sorted by project title, with trimmed fields and sanitized links
      { granteeName: 'Bob', projectTitle: 'Alpha Project', amountUsd: null, projectSummary: undefined, link: undefined },
      // ...
      { granteeName: 'Alice', projectTitle: 'Zebra Project', amountUsd: 5000, projectSummary: 'Useful work', link: 'https://example.com/zebra' },
    ]);
  });
});
```

### 4.3 Database Guidelines

#### Current Architecture

- **Source of Truth**: Airtable
- **Reads**: PostgreSQL replica
- **Writes**: Airtable + PostgreSQL sync
- **Primary Key**: User's email address (in Keycloak)

#### Schema

The database schema is defined in `libraries/db/src/schema.ts` using Drizzle ORM. There are two kinds of tables:

- **`pgAirtable(...)`** — Synced from Airtable. Used for most data (courses, users, grants, etc.). Writes go through Airtable and sync back to Postgres.
- **`pgTable(...)`** — Postgres-only. Used for data that doesn't need Airtable (e.g., sync metadata, sync requests). Writes go directly to Postgres.

Tables and their types are exported from `@bluedot/db` (e.g., `import { grantTable, type Grant } from '@bluedot/db'`).

#### Database Migrations

**How migrations work**:

In `@bluedot/db`:
1. Edit `schema.ts` to change table definitions
2. `pg-sync-service` picks up changes
3. Applies them to database (using Drizzle)
4. Starts syncing the changes

**Migration Best Practices**:

**Removing a column**:

You need to make two PRs:
1. PR 1:
  a. Remove any usage of the column
  b. Move it to `deprecatedColumns` in `libraries/db/src/schema.ts`. This will stop the application code from SELECT-ing it, but it won't be dropped from the database
  c. Merge this, *and* deploy to production
2. PR 2:
  a. Delete the column fully from `libraries/db/src/schema.ts`. This will cause it to be dropped from the database as soon as the PR is *merged* (not when it is released to production)
  b. Ensure PR 1 is deployed to production (merged to master + release created) before merging this. If you're feeling generous also wait for other developers to pull in PR 1 first

**Adding a column**:

You need to make two PRs:
1. PR 1:
  a. Add the column in `libraries/db/src/schema.ts`
  b. Merge this (no need to deploy to production)
2. PR 2:
  a. Start using the column in code

**Note**: Since Airtable is source of truth, PostgreSQL issues aren't catastrophic, but we should still avoid breaking prod data.

---

## 5. Component Library

### Storybook

**What it is**: View components individually without navigating to specific pages or triggering states manually

**Access**:
- Production: https://storybook.k8s.bluedot.org/
- Local: `cd apps/storybook && npm start` (port 6006)

### Usage Guidelines

All components in `libraries/ui` follow Bluedot branding. **Always reuse these components instead of creating new ones when possible.**

### Adding a New Icon

Custom SVG icons live in `apps/website/src/components/icons/`. They share a common API via `IconProps` (see `icons/types.ts`) so callers can control size and color consistently.

#### Interface

All icons accept:

- `size?: number | string` — defaults to a sensible value per icon (usually the viewBox dimension). Sets both width and height.
- `className?: string` — Tailwind utility classes; use `text-*` to color (icons use `currentColor` internally).
- All other SVG props (via `SVGProps<SVGSVGElement>`), spread onto the `<svg>` element.

Color comes from `currentColor`, driven by the caller's `text-*` class or a parent with `color` set.

#### Template (single-color icon)

```tsx
import type { IconProps } from './types';

export const ExampleIcon = ({ size = 20, ...props }: IconProps) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    {...props}
  >
    <path
      d="..."
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
```

Usage:

```tsx
<ExampleIcon className="text-bluedot-navy" size={24} />
```

#### When the base `IconProps` isn't enough

Some icons need extra state (e.g., `isActive`, `filled`, `variant`) or multiple colors. Extend `IconProps` with an intersection:

```tsx
type ChunkIconProps = IconProps & {
  isActive?: boolean;
};

export const ChunkIcon = ({ isActive, size = 24, className, ...props }: ChunkIconProps) => ( ... );
```

For dual-tone icons, `Omit` the conflicting SVG attribute so TypeScript catches misuse:

```tsx
type InfoIconProps = Omit<IconProps, 'fill'> & {
  bgFill?: string;
  fgFill?: string;
};
```

For non-square icons with a fixed aspect ratio, narrow `size` to `number` so the height calculation is safe:

```tsx
type DocumentIconProps = Omit<IconProps, 'size'> & {
  size?: number;
};
```

#### Updating the gallery story

All icons are previewed in `apps/website/src/components/icons/Icons.stories.tsx`. When adding an icon, register it in the appropriate section:

1. Import the new icon at the top of the file.
2. Add an `<IconCell name="YourIcon">...</IconCell>` to the right `<Section>`:
   - **Single-color icons** — simple icons using only `currentColor`.
   - **Compound icons** — icons wrapped in a `<div>` (e.g., bordered circles).
   - **Stateful / multi-variant icons** — render one cell per state (e.g., active/inactive).
   - **Dual-tone icons** — render the default, plus a variant showing custom colors.
3. If the icon has a non-default size or color baked into the variant, pass those as props on the `<IconCell>` so the preview matches real usage.

Run the gallery locally with `cd apps/storybook && npm start` and open **website/icons/Gallery → AllIcons**.

---

## 6. Deployment & DevOps

### Infrastructure
- **Platform**: Kubernetes with nginx on Vultr
- **Infrastructure as Code**: Pulumi (`apps/infra`)
- **Observability**: OpenTelemetry, Grafana
- **Preview environments**: Render

### Clearing the CI cache

If CI is behaving strangely (e.g. tests pass locally but fail in CI, or you're seeing errors about missing dependencies), try clearing the CI cache: go to [Actions → Clear CI/CD Cache → Run workflow](https://github.com/bluedotimpact/bluedot/actions/workflows/clear_cache.yaml).

### Force deploying the website

Production deploys normally require CI/CD to have passed on the tagged commit. To bypass this in an emergency, go to [Actions → website_deploy_production → Run workflow](https://github.com/bluedotimpact/bluedot/actions/workflows/website_deploy_production.yaml), select the tag to deploy, and tick "Skip CI/CD check".

### Preview deployments

Render automatically deploys a preview site for each open PR, this is the only thing we use it for (the production site is deployed by Kubernetes on our own cluster).

To enable this in the Render dashboard, preview deployments need to be turned on for PRs against master, and these three steps need to be set in the project settings:
- **Build:** `cd apps/website && npm install && npm run render-preview -- build`
- **Pre-deploy:** `cd apps/website && npm run render-preview -- pre-deploy`
- **Start:** `cd apps/website && npm run render-preview -- start`

Required environment variables in Render (in addition to what is generally required):
- `KEYCLOAK_PREVIEW_AUTH_TOKEN` — shared secret for authenticating with the production endpoint that registers redirect URIs
- `SITE_ACCESS_PASSWORD` — password gate for preview sites
  - Note: This is in 1password under "Preview env login (bluedot.org)". Unfortunately it can't prefill because the subdomain on preview environments is always different.

The production website also needs:
- `KEYCLOAK_PREVIEW_AUTH_TOKEN` (same shared secret as above)
- `KEYCLOAK_PREVIEW_CLIENT_ID` — service-account client ID with `manage-clients` role (NOT set on Render preview environments)
- `KEYCLOAK_PREVIEW_CLIENT_SECRET` — corresponding client secret

### Deployment Processes

#### Website
- Production deployment: See `apps/website/README.md#production`

#### Login App
- See: `apps/login#deployment`

#### Keycloak Theme Updates
- Update version in: `apps/login/tools/getBluedotKeycloakTheme.sh`

#### Postgres Deployment
- Undocumented

### Authentication
- Production Keycloak instance for auth/password management
- No password info stored in Airtable
- Can run locally through "login" app
- Custom theme available in bluedot-keycloak-theme repo which can be used instead of the "login" app

### Observability Stack Data Flow

```
 +--------------+
 | Applications |
 +--------------+
         |
         | (metrics, logs)
         v
 +---------------+
 | OpenTelemetry |
 |   Collector   |
 +---------------+
      |       |
      |       +------------------+
      |                          |
      | (metrics)                | (logs)
      v                          v
 +------------------+    +---------------+
 | Prometheus       |    | Loki          |
 | (metric storage) |    | (log storage) |
 +------------------+    +---------------+
      |                          |
      |                          |
      +---------------+----------+
                      |
                      v
           +----------------------+
           |       Grafana        |
           | (dashboards, alerts) |
           +----------------------+
```
#### Data Flow:
 1. There are multiple applications, across multiple kubernetes nodes. These produce metrics and logs.
    - Metrics are sent via the OpenTelemetry SDK to a collector. In Next.js apps this is set up with instrumentation.ts.
    - Logs are sent by logging them to stdout (e.g. with console.log or Winston). Kubernetes automatically saves these logs to files.
 2. The OpenTelemetry Collector collects these metrics and logs, enriches them, and sends them on to Prometheus and Loki.
    - It operates on every node (computer) in the Kubernetes cluster
    - For metrics, it hosts a HTTP server using the OTLP standard which apps can send metrics to
    - For logs, it collects logs from Kubernetes's saved log files
    - It also adds some metadata, e.g. what service and node the metrics or logs are from
    - It then sends the enriched metrics and logs data on to Prometheus and Loki
    - The reason we use the OpenTelemetry Collector, instead of apps sending directly to Prometheus and Loki, is:
      - For custom apps, we can add custom code to send logs and metrics to the right servers. But for off-the-shelf software (e.g. nginx), we can't do this - so need something to collect logs etc.
      - Even for our custom apps, with the OTel collector we can easily change where we want to send logs and metrics, without making code changes to every app. This allows us to easily experiment to find the best tools, and avoids vendor lock-in.
      - The collector enriches the data, so that the data is easier to use.
 3. Prometheus and Loki store and index metrics and logs respectively
 4. Grafana queries both Prometheus and Loki to create dashboards and alerts
    - Developers can login to view the data at grafana.k8s.bluedot.org

---

## 7. Appendices

### Appendix A: Established Decisions

| Decision | Rationale |
|----------|-----------|
| tRPC for all data fetching | End-to-end type safety, built-in React Query, standardized error handling |
| PGlite for backend testing | In-memory PostgreSQL for fast, isolated integration tests |
| Inline Zod schemas via tRPC | No separate shared schema files needed — tRPC provides type safety natively |
| Tailwind CSS (no BEM) | BEM didn't provide additional benefits over Tailwind's utility classes |
| React Testing Library best practices | Tests should resemble how users interact with the software |
| Snapshot + functional tests | Catches regressions and ensures functionality |
| Airtable + PostgreSQL architecture | Best of both worlds — CRM features + performance |

### Appendix B: FAQ

#### Development Issues

**Q: How do I update bluedot-keycloak-theme?**  
A: Update the version in `apps/login/tools/getBluedotKeycloakTheme.sh`

**Q: What about local development without production data?**  
A: Currently requires production Airtable. Local setup is a known limitation.

### Appendix C: Glossary

- **Base**: Database in Airtable terminology
- **QPS**: Queries Per Second
