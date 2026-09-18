# Candidate sourcing

- Treat candidate source data, assessments and reviewer notes as private. Never commit runtime data, credentials or `.ashby-key`.
- Preserve the assessment, feedback and Ashby workflows when changing the transport. The Python service is API-only and binds to loopback; staff authentication belongs to the portal's tRPC layer.
- Keep one engine process per data directory. Existing file locks are process-local.
- Automated mutation checks must use the synthetic fixture or temporary test directories. Never run them against real people or Ashby records.
- Run the Python tests plus the portal's relevant TypeScript and browser checks. The fixture's default mode contains intentional waits; use `--demo` for human previews.
