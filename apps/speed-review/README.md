# BlueDot Apps

The team portal lives in this existing Next.js app so Speed Reviewer has one maintained implementation. The package and Kubernetes service retain their `speed-review` names during the transition.

The home page lists published tools. A collapsible sidebar stays beside each tool; its preference is stored in the current browser. Speed Reviewer is the first app, at `/speed-review`. More tools can follow through normal PRs.

## Run locally with real data

The normal local app uses Google staff sign-in and the same Airtable records as the hosted reviewer. Ratings, resets, and course moves update shared records immediately.

1. Copy the existing reviewer `.env.local` into this worktree. Ensure `AIRTABLE_PERSONAL_ACCESS_TOKEN` contains the approved BlueDot credential with read and write access to the reviewer base and its application fields; the template's empty value is not enough. A successful read does not verify write permission. Keep this file ignored by Git. For local development, leave `ALERTS_SLACK_BOT_TOKEN=IGNORE_SLACK_ALERTS`.
2. Leave `NEXT_PUBLIC_LOCAL_PREVIEW` unset.
3. From the repository root, run:

```sh
npm ci
npm run start --workspace @bluedot/speed-review
```

Open `http://localhost:8000` and choose **Continue with Google**. Use this hostname: the existing Google OAuth client accepts `http://localhost:8000/login/oauth-callback`, while `127.0.0.1` produces `redirect_uri_mismatch`. Sign in with a BlueDot account. Ordinary localhost use is fully connected to Airtable; it does not need a separate local database for the reviewer.

Do not use real applicants for automated mutation tests. For live acceptance, use a designated test application or make a genuine review decision and check that it persists in Airtable.

Every API endpoint verifies BlueDot Google Workspace membership through `loginPresets.googleBlueDot`, including the verified organization claim. Portal access does not require or grant the website's separate admin role. Expired or rejected credentials return the UI to sign-in at the requested route.

Ratings advance only after a successful save. Timer expiry moves an unrated application to the back of the queue. If only one application remains, its timer restarts and the UI explains why the same application stays visible; expiry never saves a rating. Failed ratings remain on the same application and can be retried. Leaving an active review asks for confirmation. Navigation and sign-out wait for pending writes. This release does not restore an unfinished session after refresh; saved ratings remain stored.

## Optional sample-data mode

For automated browser checks or design experiments only:

```sh
npm run start:preview --workspace @bluedot/speed-review
```

Choose **Explore local preview**. All applicants are synthetic. Ratings, resets, and course moves affect only sample data in the local server's memory; restarting resets them. This mode needs no data credentials and never sends Slack alerts. Stop it before starting the real app on the same port.

The preview requires both a development build and `NEXT_PUBLIC_LOCAL_PREVIEW=true`. Production rejects its synthetic identity even when the flag is accidentally set. This mode is bound to loopback and is not for publicly hosted preview environments.

## Add or improve a tool

1. Add its page under `src/pages/` and group its components and backend code by feature.
2. Add its name, description, icon, and route to `src/lib/apps.ts`. The home page and sidebar read the same list.
3. Reuse `PortalLayout`, `@bluedot/ui`, and the shared design tokens. Protect server reads and writes with staff authentication. New data access should follow the monorepo's `@bluedot/db` and tRPC conventions; the reviewer retains its existing Airtable integration.
4. Register active work and pending writes with `useNavigationState` so navigation cannot silently abandon them.
5. Test with synthetic/local data, open a PR, and publish through the normal deployment process after review.

Personal experiments can stay in local branches or forks with local/test data and no production write credentials. The portal does not create or host personal forks. Talent sourcing's multi-user hosting is a separate project; its Python backend can be retained.

## Verification

```sh
npm run test --workspace @bluedot/speed-review
npm run test:ui --workspace @bluedot/speed-review # with start:preview running
npm run typecheck --workspace @bluedot/speed-review
npm run lint --workspace @bluedot/speed-review
npm run build --workspace @bluedot/speed-review
```

The browser regression check uses Playwright (install its headless Chromium with `npx playwright install chromium` if needed). It only accepts the local synthetic preview.

Tests cover staff access, rejected identities, validated writes, production rejection of preview tokens, and local data isolation. Browser verification also needs home/reviewer deep links, sidebar persistence, keyboard navigation, failed-save retry, browser Back, sign-out, and short/tall viewports.

## Deployment and rollout

This app uses the existing Docker/Kubernetes deployment. Merging to master automatically deploys it, so keep the PR in draft until local acceptance and the checks below are complete. Opening the draft does not deploy it to production.

Before merging:

- Configure and verify DNS for `apps.bluedot.org` to the existing ingress. The service definition requests HTTPS for both domain names.
- Register the new domain's `/login/oauth-callback` with the existing staff Google OAuth client. The existing `http://localhost:8000/login/oauth-callback` is accepted for local sign-in; a different hostname or port needs its own registered callback.
- Confirm existing reviewer users have BlueDot Google accounts. This switches the reviewer from Keycloak plus a website-admin flag to staff Google sign-in; non-staff website admins will no longer have access.

After deployment, verify one staff login, a rejected non-staff login, sign-out, and deep links on the final domain.

The existing reviewer hostname remains routed to this service and redirects its root to `/speed-review`. Roll back the application and ingress changes together if the portal fails verification. No database schema migration is required.
