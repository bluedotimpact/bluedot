# Candidate sourcing engine

This directory owns the existing Python assessment engine and its regression tests. The user interface is the portal's TypeScript/React feature in `../src/features/candidate-sourcing`; `../src/server` provides validated, staff-authenticated tRPC procedures. The Python package keeps its internal `talent_sourcing` name to preserve tested imports and stored data formats. There is no standalone frontend build or HTML route here.

## Local use with existing searches

Requirements: Python 3.11+, the existing Claude CLI account used for assessments, and `ASHBY_API_KEY` in the engine process environment. Keep credentials out of Git. The engine also supports the original ignored `.ashby-key` file for local development. It uses the existing fast, medium-effort model configuration and concurrent assessment workers.

1. Stop the old standalone engine before opening its data directory with this engine. Never run two engines against the same data directory: in-process locks do not coordinate separate processes. Wait for or cancel any active assessment before switching.
2. From the repository root, start the integrated engine, pointing to the existing data directory:

```sh
npm run start:candidate-engine --workspace @bluedot/team-apps -- --data-dir /absolute/path/to/existing/data --port 8769
```

3. Set `CANDIDATE_SOURCING_URL=http://127.0.0.1:8769` in the portal's ignored `.env.local`. Leave `NEXT_PUBLIC_LOCAL_PREVIEW` unset. Start the portal normally and sign in with a BlueDot Google account.
4. Open `/candidate-sourcing`. Saved searches, scores, notes and Ashby lead records are read in place. No export or data copy is needed. Existing searches also have portal deep links at `/candidate-sourcing/<search-id>`.

Unsubmitted browser drafts belong to the old browser origin. Save those in the old app before switching. Saved server reviews remain available in the portal.

The existing OAuth client accepts `http://localhost:8000/login/oauth-callback`. A separate portal on port 8011 needs `http://localhost:8011/login/oauth-callback` added to that same client's authorized redirect URIs before real-data sign-in works. Preserve existing callback entries. Do not borrow credentials from another tab or enable the sample identity against real records.

## Isolated sample preview

Use this when port 8000 is owned by another development session. From the repository root, start the synthetic engine:

```sh
npm run start:candidate-preview --workspace @bluedot/team-apps
```

In another terminal, start the portal from `apps/team-apps`:

```sh
NEXT_PUBLIC_LOCAL_PREVIEW=true CANDIDATE_SOURCING_URL=http://127.0.0.1:8770 ../../node_modules/.bin/next dev --hostname localhost -p 8011
```

Open `http://localhost:8011/candidate-sourcing` and choose **Explore local preview**. People, roles, assessments, reviews and Ashby leads are synthetic. The fixture creates temporary data and discards it when stopped. Sample assessments run without a paid model and cannot contact real Ashby. The portal checks the engine's synthetic marker before every preview request and rejects a real engine.

## Verification

From the repository root:

```sh
npm run test:candidate-engine --workspace @bluedot/team-apps
npm run test --workspace @bluedot/team-apps
npm run typecheck --workspace @bluedot/team-apps
npm run lint --workspace @bluedot/team-apps
npm run build --workspace @bluedot/team-apps
```

For the browser workflow test, start a fresh fixture without `--demo` (the test uses deterministic pauses for cancellation and partial results), and point the sample portal at it:

```sh
# From apps/team-apps/candidate-sourcing
python3 -B tools/ui_fixture.py --port 8770

# From apps/team-apps, with the sample portal already running on 8011
PORTAL_TEST_URL=http://localhost:8011 CANDIDATE_TEST_ENGINE_URL=http://127.0.0.1:8770 npm run test:candidate-ui
PORTAL_TEST_URL=http://localhost:8011 npm run test:ui
```

Restart the fixture before each full candidate workflow run. Set `UI_OUTPUT_DIR` to a temporary directory to keep screenshots for inspection. The test verifies pagination, keyboard navigation, saved notes, genuine version conflicts, synthetic Ashby exports, partial assessment results, cancellation, criteria updates across all assessed people, new searches, scoped routing, and mobile/desktop layouts.

## Production work after local acceptance

Do not point the hosted portal at a developer's machine. The engine requires persistent storage and one owning process for each candidate data directory. A colocated engine can keep the loopback-only API; other hosting arrangements need a separately authenticated private service boundary. Configure the model runner's production credentials and pass the existing server-only Ashby secret to the engine process. Migrate the existing data with the old engine stopped, verify backups and review/job recovery, then exercise staff sign-in and a designated test lead before rollout. The current web container does not start or provision this Python engine.
