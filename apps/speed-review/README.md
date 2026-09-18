# BlueDot Apps

The team portal lives in this existing Next.js app so Speed Reviewer has one maintained implementation. The package and Kubernetes service retain their `speed-review` names during the transition.

The home page lists published tools. A collapsible sidebar stays beside each tool; its preference is stored in the current browser. Speed Reviewer is the first app, at `/speed-review`. More tools can follow through normal PRs.

## Try the local preview

From the repository root:

```sh
npm ci
npm run start:preview --workspace @bluedot/speed-review
```

Open the address printed by Next.js and choose **Explore local preview**. The server binds to `localhost:8000`. Use this hostname: the existing Google OAuth client accepts `http://localhost:8000/login/oauth-callback`, while `127.0.0.1` produces `redirect_uri_mismatch`. All applicants are synthetic. Ratings, resets, and course moves affect only sample data in the local server's memory; restarting the server resets them. No Airtable, Postgres, or AI credentials are needed for this mode. It never sends Slack alerts.

The preview requires both a development build and `NEXT_PUBLIC_LOCAL_PREVIEW=true`. Production rejects its synthetic identity even when the flag is accidentally set. Keep this command bound to loopback. The preview is for local product testing, not for publicly hosted preview environments.

## Real sign-in and application data

Run the regular `npm run start --workspace @bluedot/speed-review` with the existing `.env.local` configuration. This uses Google sign-in and the real application service. Do not use real records for automated mutation tests.

Every API endpoint verifies BlueDot Google Workspace membership through `loginPresets.googleBlueDot`, including the verified organization claim. Portal access does not require or grant the website's separate admin role. Expired or rejected credentials return the UI to sign-in at the requested route.

Ratings advance only after a successful save. Failed ratings remain on the same application and can be retried. Leaving an active review asks for confirmation. Navigation and sign-out wait for pending writes. This release does not restore an unfinished session after refresh; saved ratings remain stored.

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
