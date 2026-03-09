# Deployment Plan: Access Control & PII Safety

## Current state

The app has Keycloak login UI pages (`/login`, `/login/oauth-callback`) and the `makeApiRoute` infrastructure supports `requireAuth: true`, but **all four API routes currently set `requireAuth: false`**. This means anyone who can reach the server can read applicant PII (names, profile URLs, job info, AI summaries) and write decisions to Airtable — no authentication required.

The app handles sensitive applicant data including: full names, LinkedIn/profile URLs, job titles, employers, free-text essays, and AI-generated summaries.

---

## Plan

### 1. Enforce authentication on all API routes

Change every route from `requireAuth: false` to `requireAuth: true`:

- `src/pages/api/applications.ts`
- `src/pages/api/decisions.ts`
- `src/pages/api/rounds.ts`
- `src/pages/api/round-stats.ts`

The `makeApiRoute` + Keycloak `verifyAndDecodeToken` plumbing is already wired up in `src/lib/api/makeApiRoute.ts`. Flipping the flag is the only code change needed per route. Once done, any request without a valid Keycloak JWT will receive a 401.

### 2. Restrict to admins only

Authentication (any Keycloak account) is not enough — access must be limited to team members with `isAdmin: true` in the DB. After verifying the JWT, each handler should confirm the caller is an admin before returning data.

The pattern used in `apps/website/src/server/trpc.ts` is `checkAdminAccess`, which queries `userTable` (not `personTable`):

```ts
// src/lib/api/requireAdmin.ts
import createHttpError from 'http-errors';
import db from './db';
import { userTable } from '@bluedot/db';

export const requireAdmin = async (email: string) => {
  const user = await db.getFirst(userTable, { filter: { email } });
  if (!user?.isAdmin) {
    throw new createHttpError.Forbidden('Admin access required');
  }
};
```

Then in each handler:

```ts
}, async (body, { auth }) => {
  await requireAdmin(auth.email);
  // ...existing logic
});
```

**Note:** The app currently has no DB dependency. You will need to add `@bluedot/db` to `package.json` dependencies and create `src/lib/api/db.ts` mirroring the pattern from other apps (e.g. `app-template`).

### 3. Guard the frontend against unauthenticated access

Use the `withAuth` HOC from `@bluedot/ui` to wrap the main page component. This redirects unauthenticated users to `/login` before rendering any applicant data. This is a UX improvement only — security is enforced server-side by steps 1 & 2.

```ts
// src/pages/index.tsx
import { withAuth } from '@bluedot/ui';

const SpeedReviewPage = ({ auth }) => { ... };

export default withAuth(SpeedReviewPage);
```

Note the website pattern does **not** check admin status on the frontend — it relies on the backend returning 403 and showing an error state. The `withAuth` HOC only gates on being logged in at all, which avoids a DB round-trip on every page load just to show a redirect.

### 4. Verify no secrets are exposed client-side

Confirm that no environment variables are prefixed `NEXT_PUBLIC_`. Currently:
- `AIRTABLE_PERSONAL_ACCESS_TOKEN` — server-only ✓
- `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_ID` — server-only ✓

All Airtable calls happen in `src/lib/api/airtable.ts` (server-side only). The browser only receives the shaped `Application` objects returned by the API, not raw Airtable records or credentials. This is already correct.

### 5. Deploy to the existing K8s cluster with a restricted hostname

The app already deploys via `npm run deploy:cd` (Docker → K8s). To make the deployment admin-only at the network level as a defence-in-depth layer, configure the K8s ingress for this app to:

- Use an internal-only hostname (e.g. `speed-review.internal.bluedot.org`) that does not resolve publicly, **or**
- Add an IP allowlist annotation on the ingress restricting access to the office VPN / known admin IPs.

This is configured in `infra/serviceDefinitions.ts` alongside the other app service definitions. If the ingress controller supports it (nginx-ingress does), add:

```yaml
nginx.ingress.kubernetes.io/whitelist-source-range: "<VPN CIDR>"
```

Network restriction is a second line of defence. The auth checks in steps 1–2 are the primary controls and must be in place regardless.

---

## Summary of changes

| # | What | Where | Risk if skipped |
|---|------|-------|-----------------|
| 1 | `requireAuth: true` on all 4 API routes | `src/pages/api/*.ts` | Anyone can read PII / write decisions |
| 2 | Admin check after auth | new `src/lib/api/requireAdmin.ts` + each route handler | Any Keycloak user (e.g. course participants) could access |
| 3 | Frontend auth guard | `src/pages/_app.tsx` | UX gap only (security still enforced server-side) |
| 4 | No `NEXT_PUBLIC_` secrets | `src/lib/api/env.ts` | Already correct, no change needed |
| 5 | Ingress IP allowlist | `infra/serviceDefinitions.ts` | Defence-in-depth layer missing, not a primary control |

Do steps 1 and 2 before deploying. Steps 3–5 are hardening.
