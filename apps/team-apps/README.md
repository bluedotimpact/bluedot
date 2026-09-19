# BlueDot Apps

The team portal is a separate Next.js app (`@bluedot/team-apps`) with its own `bluedot-team-apps` deployment. Speed Reviewer is the first tool. During the trial, the existing `apps/speed-review` app stays at its original hostname with its original sign-in.

Signed-out visitors see only a minimal Google sign-in page, including when opening an app directly. App names, navigation, and screens appear after sign-in. The signed-in home page lists published tools. A collapsible sidebar stays beside each tool; its preference is stored in the current browser. Toggle it with ⌘B on Mac or Ctrl+B on Windows/Linux, matching the course pages; typing in an input or editor leaves that shortcut alone. Speed Reviewer is the first app, at `/speed-review`. Talent Capture opens its Chrome Web Store listing in a new tab. External tools appear alongside internal apps after sign-in; opening one leaves the current portal page and any review session in place.

## Run locally with real data

The normal local app uses Google staff sign-in and the same Airtable records as the hosted reviewer. Ratings, resets, and course moves update shared records immediately.

1. Copy the existing reviewer `.env.local` into this worktree. Ensure `AIRTABLE_PERSONAL_ACCESS_TOKEN` contains the approved BlueDot credential with read and write access to the reviewer base and its application fields; the template's empty value is not enough. A successful read does not verify write permission. Keep this file ignored by Git. For local development, leave `ALERTS_SLACK_BOT_TOKEN=IGNORE_SLACK_ALERTS`.
2. Leave `NEXT_PUBLIC_LOCAL_PREVIEW` unset.
3. From the repository root, run:

```sh
npm ci
npm run start --workspace @bluedot/team-apps
```

Open `http://localhost:8000` and choose **Continue with Google**. Use this hostname: the existing Google OAuth client accepts `http://localhost:8000/login/oauth-callback`, while `127.0.0.1` produces `redirect_uri_mismatch`. Sign in with a BlueDot account. Ordinary localhost use is fully connected to Airtable; it does not need a separate local database for the reviewer.

Do not use real applicants for automated mutation tests. For live acceptance, use a designated test application or make a genuine review decision and check that it persists in Airtable.

Every API endpoint verifies BlueDot Google Workspace membership through `loginPresets.googleBlueDot`, including the verified organization claim. Portal access does not require or grant the website's separate admin role. Expired or rejected credentials return the UI to sign-in at the requested route.

Ratings advance only after a successful save. Timer expiry moves an unrated application to the back of the queue. If only one application remains, its timer restarts and the UI explains why the same application stays visible; expiry never saves a rating. Failed ratings remain on the same application and can be retried. Leaving an active review asks for confirmation. Navigation and sign-out wait for pending writes. This release does not restore an unfinished session after refresh; saved ratings remain stored.

## Optional sample-data mode

For automated browser checks or design experiments only:

```sh
npm run start:preview --workspace @bluedot/team-apps
```

Choose **Explore local preview**. All applicants are synthetic. Ratings, resets, and course moves affect only sample data in the local server's memory; restarting resets them. This mode needs no data credentials and never sends Slack alerts. Stop it before starting the real app on the same port.

The preview requires both a development build and `NEXT_PUBLIC_LOCAL_PREVIEW=true`. Production rejects its synthetic identity even when the flag is accidentally set. This mode is bound to loopback and is not for publicly hosted preview environments.

## Add or improve a tool

1. Add its page under `src/pages/` and group its components and backend code by feature.
2. Add its name, description, icon, and route to `src/lib/apps.ts`. The home page and sidebar read the same list. For an externally hosted app or Chrome extension, use its full HTTPS URL and `external: true`; no portal page is needed. External links open a new tab with `noopener noreferrer` and bypass the leave-session prompt because the current session stays open.
3. Reuse `PortalLayout`, `@bluedot/ui`, and the shared design tokens. Protect server reads and writes with staff authentication. New data access should follow the monorepo's `@bluedot/db` and tRPC conventions; the reviewer retains its existing Airtable integration.
4. Register active work and pending writes with `useNavigationState` so navigation cannot silently abandon them.
5. Test with synthetic/local data, open a PR, and publish through the normal deployment process after review.

Personal experiments can stay in local branches or forks with local/test data and no production write credentials. The portal does not create or host personal forks. Talent sourcing's multi-user hosting is a separate project; its Python backend can be retained.

## Verification

```sh
npm run test --workspace @bluedot/team-apps
npm run test:ui --workspace @bluedot/team-apps # with start:preview running
npm run typecheck --workspace @bluedot/team-apps
npm run lint --workspace @bluedot/team-apps
npm run build --workspace @bluedot/team-apps
```

The browser regression check uses Playwright (install its headless Chromium with `npx playwright install chromium` if needed). It only accepts the local synthetic preview.

Tests cover staff access, rejected identities, validated writes, production rejection of preview tokens, and local data isolation. Browser verification also needs home/reviewer deep links, sidebar persistence, keyboard navigation, failed-save retry, browser Back, sign-out, and short/tall viewports.

## Deployment and parallel trial

Merging to master automatically deploys the portal and its infrastructure. Keep the PR in draft until local acceptance and production setup are complete. The existing reviewer is preserved during the trial:

| App | Package | Deployment | Hostname | Sign-in |
| --- | --- | --- | --- | --- |
| Portal | `@bluedot/team-apps` | `bluedot-team-apps` | `apps.bluedot.org` | BlueDot Google Workspace |
| Existing reviewer | `@bluedot/speed-review` | `bluedot-speed-review` | `speed-review.k8s.bluedot.org` | Existing Keycloak/admin access |

The deployments have separate images, services, ingress routes, and HTTPS certificates. The old hostname does not redirect during the trial. Both apps read and write the same Airtable records: a real rating made in either is shared. This is a trial of the interface and sign-in, not an isolated data sandbox. Avoid reviewing the same application concurrently in both apps; neither claims exclusive ownership of a loaded application.

### In this PR

- Add the `team-apps` package and its independent deployment at the new hostname.
- Keep the legacy `speed-review` source and service definition unchanged.
- Reuse the staff Google login preset and existing production secret references.
- Request the new hostname's HTTPS certificate through the existing certificate manager.

### Separate production settings

Before merging:

1. Add DNS for `apps.bluedot.org` pointing to the cluster ingress, matching the current destination of the existing Kubernetes app hostnames. Verify the destination at rollout rather than hard-coding an old IP address.
2. In the existing staff Google OAuth client's settings, add exactly `https://apps.bluedot.org/login/oauth-callback` to its authorized redirect URIs. Preserve the existing callback entries. The code derives this callback from the current origin; it does not register the domain with Google.
3. Verify the production Airtable credential permits reads and writes to the reviewer base and application fields. Local `.env.local` is ignored and is not deployed. Update production secrets through the existing Pulumi secret workflow only if needed.

After deployment, verify HTTPS, a staff login, rejection of a non-staff login, sign-out, reviewer deep links, and a genuine rating or designated test record that persists after refresh. Confirm the old reviewer still loads and retains its existing sign-in. Check course moves and resets with designated test records before team rollout. The course move sends all three changed fields in one request; the existing Airtable automation still fills the derived course link.

The normal app and infrastructure deployment jobs run independently. On first deployment, confirm both complete; if the image build finishes before the new deployment exists, rerun the portal deploy job after infrastructure is ready.

If the portal fails verification, keep the old reviewer available and roll back only the portal changes. No database schema migration or data copy is required.

### Ashby key for talent sourcing

Add a repository Actions secret named `ASHBY_API_KEY` in `bluedotimpact/bluedot`.
Use an Ashby key with `jobsRead`, `candidatesRead` and `candidatesWrite` permissions.
The key is passed only to the infrastructure deployment, marked secret in Pulumi,
and stored in a Kubernetes Secret. Only the `bluedot-team-apps` container receives
it as the server environment variable `ASHBY_API_KEY`. It is not a build argument
or a `NEXT_PUBLIC_` variable.

Create this GitHub secret before merging the infrastructure change. An infrastructure
run without this key or a local Pulumi `ashbyApiKey` value fails rather than publishing
an empty key. For local infrastructure previews, provide `ASHBY_API_KEY` privately or
use `npm run config:secret ashbyApiKey` from `apps/infra`; do not commit a plaintext key.

This provisions the credential only. Talent sourcing still needs its authenticated
portal integration, durable data and job hosting before it can run here. The local
Python server remains loopback-only. Its existing key is not copied to production.

For key rotation, update the GitHub secret, run the infrastructure deployment, then
restart the team-apps deployment using the normal rollout procedure in the infra guide.
Changing the GitHub secret alone does not update a running container.

### End of trial

Dewi has a retirement task due 2 Oct 2026. Extend the trial if launch is delayed or regressions remain. After acceptance, use a separate PR to remove the old `apps/speed-review` package and service, and redirect its old hostname to `https://apps.bluedot.org/speed-review` so bookmarks keep working. Preserve the shared Airtable data, shared secrets, and the new portal deployment.

## Scout

Scout lives at `/scout` and is available to every verified BlueDot staff account. It ports the current non-AI review workflow from Eleni's `eleni/scout-queue` branch (source commit `f4f2dc2e`). It retains the locked Airtable queue's order, the supported TAIS / TAIS Project / Biosecurity courses, participant history and feedback. Existing application-time AI summaries may be displayed; Scout makes no model calls.

Both decisions need confirmation. Invite sets the existing Course runner email trigger; don't invite sets the scouting status to `Pass`. Skip changes only the current browser session. The server re-reads contact/status fields and queue membership before writing. All portal decisions for one registration hold a PostgreSQL transaction advisory lock through `@bluedot/db`, so concurrent portal requests cannot overwrite each other after passing a stale check. There is no schema migration. This lock does not coordinate manual Airtable edits or the original standalone Scout app.

The existing `PG_URL` must be reachable to save real decisions. Reads retain Scout's Airtable adapter because several source fields are not synced; this port does not add or change the shared database schema. The Airtable credential needs read access to both Course runner and Applications, and write access to the Course runner decision fields. Secrets stay server-side. The adapter spaces requests and uses the existing retry helper; ambiguous failed writes are not automatically retried. Navigation, course changes and skip wait for the save, and a failed save stays on the selected participant for retry.

Use the existing `start:preview` command to review synthetic Scout participants and test decisions without sending emails or changing Airtable. The sample state resets on server restart. Ordinary `start` uses live data even on localhost. Do not automate decisions on real participants.

Run `npm run test:scout-ui --workspace @bluedot/team-apps -- <screenshot-directory>` with the synthetic preview running for the Scout browser regression and viewport checks.

The app test suite includes Scout access, read/write validation, decision payloads, stale records, retry behavior, navigation controls and preview isolation. Optional concurrency tests run against a disposable PostgreSQL database on loopback:

```sh
SCOUT_TEST_PG_URL=postgresql://localhost-user@127.0.0.1:55439/postgres npm test --workspace @bluedot/team-apps
```

Use an actual disposable local database URL for that command; the test refuses non-loopback hosts. The integration needs a designated-test-record invitation check and production credential verification before deployment. A local UI review does not send a real invitation.

### Scout design comparison

The three `/scout/designs/session`, `/scout/designs/inbox` and `/scout/designs/board` pages are interactive proposals for the whole review workflow. They use Speed Reviewer's grouped course/round picker pattern, but read Scout's existing queue rather than the applications-review queue. The queue response includes names and stable round IDs so the list is fast and filters do not confuse identically named rounds.

All choices on these pages are component-local drafts; none calls the decision endpoint. They reset when leaving the page. `?demo=1` uses fictional participants for comparisons and screenshots; staff authentication still applies. Without that query, the prototypes read the live queue. A decision brief surfaces facilitator feedback, project notes and next steps, while Full record retains the original history, application and feedback card. No model calls or new ranking rules are introduced.

Run `npm run test:scout-designs --workspace @bluedot/team-apps -- <screenshot-directory>` against `start:preview` for all three workflow checks and 57 viewport states. These comparison routes remain draft-only; `/scout` implements the selected focused-review direction. The PR remains a draft for local acceptance.


### Focused Scout review

`/scout` now uses the selected focused-review layout. Choose a course round using the Speed Reviewer pattern, then read a short selection of original notes or open the full record. Invite and don't invite use the existing confirmed, locked decision endpoint. Skip, undo skip and revisiting skipped people are session-only. Finishing early shows saved decisions and allows resuming; invitation delivery remains Airtable's responsibility.

The course/round picker only lists registrations already in the locked Scout view. Its exact Airtable filter predicates are not exposed by the metadata API. No AI is used to rank or choose people. Existing `/scout/designs/*` comparison pages remain draft-only.

`npm run test:scout-ui` verifies the functional flow against the isolated local sample-data server, including confirmation, failures/retry, pending-write guards, round selection, skip/undo, session resume and 38 picker/review viewport states.
