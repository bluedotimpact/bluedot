# Environment Variables Guide

## Overview

Two types of environment variables:

1. **Backend Variables** - Server-side only (API keys, database URLs, channel IDs)
2. **Public Variables (NEXT_PUBLIC_)** - Browser-accessible (analytics IDs, public URLs)

### Prerequisites

**For backend secrets:**
- Pulumi passphrase from [1Password](https://start.1password.com/open/i?a=HTUBIRRURRGNNAKFHX5DU3YWRI&v=j3reqistnwqma7zpy5lzdnwvpi&i=fvtnqvlv5mvrer7o5zm4iijsga&h=bluedotimpact.1password.com)
- Save to: `bluedot/apps/infra/passphrase.prod.txt`

---

## The Two-PR Workflow

### Why Two PRs?

1. **Security**: Provision secrets before code needs them
2. **Verification**: Confirm secrets work before implementing features
3. **Separation**: Infra reviews separate from code reviews
4. **Safety**: If something fails, easier to identify which change caused it

### Workflow Overview

```
PR #1 (Infra)
  Add secret to Pulumi + configure Kubernetes
  Merge → infra deploys
  Manually restart pods
  Check pod logs (verify pod starts successfully)
        ↓
PR #2 (Code)
  Add validation + implement feature
  Merge → service deploys + pods restart automatically
  Feature goes live
```

---

## Backend Variables

### Part 1: Infrastructure PR

**1. Add Secret to Pulumi (if sensitive)**

For secrets (API keys, passwords, database URLs):
```bash
cd bluedot/apps/infra
npm run config:secret myApiKey
# Enter production value when prompted
```

For non-secrets (channel IDs, public URLs): Skip to step 3.

**2. Register for Kubernetes (if you did step 1)**

Edit `bluedot/apps/infra/src/k8s/secrets.ts`:
```typescript
const toK8s = [
  'airtablePass',
  // ... existing
  'myApiKey',  // ← Add here
] as const;
```

**3. Map to Service**

Edit `bluedot/apps/infra/src/k8s/serviceDefinitions.ts`:

Find your service:
- `bluedot-website-production` (website)
- `bluedot-pg-sync-service` (pg-sync)

Add to `env` array:

```typescript
// From Pulumi (sensitive)
{ name: 'MY_API_KEY', valueFrom: envVarSources.myApiKey }

// Hardcoded (non-sensitive)
{ name: 'CHANNEL_ID', value: 'C04SAGM4FN1' }
```

**4. Create PR and Deploy**

```bash
git add bluedot/apps/infra/
git commit -m "Add MY_API_KEY to infrastructure"
git push
# Create PR and merge
```

After merge, GitHub Actions runs `pulumi up` which creates/updates the Kubernetes secret.

**5. Restart Pods**

Pods need to restart to load the new environment variable.

**Option A: Manual restart with kubectl**

```bash
cd bluedot/apps/infra

# One-time setup for kubectl access
PULUMI_CONFIG_PASSPHRASE_FILE=passphrase.prod.txt \
  pulumi stack output --show-secrets k8sConfig > kubeconfig.yaml
export KUBECONFIG=$(pwd)/kubeconfig.yaml

# Restart the deployment
kubectl rollout restart deployment/bluedot-website-production-deployment
# OR
kubectl rollout restart deployment/bluedot-pg-sync-service-deployment

# Wait for rollout to complete
kubectl rollout status deployment/bluedot-website-production-deployment
```

**Option B: Make a trivial service code change**

If you don't have kubectl access or prefer not to set it up, you can trigger an automatic restart by making any service code change:

```bash
# Example: Add a comment to any file in the service
echo "// Trigger deployment" >> bluedot/apps/website/src/lib/api/env.ts
git add .
git commit -m "Trigger deployment to pick up new secrets"
git push
# Merge PR → service deploys and restarts automatically
```

This triggers the service deployment which automatically restarts pods.

**6. Verify**

Check that pods started successfully:

```bash
# Get pod name (note that these haven't been tested)
kubectl get pods | grep bluedot-website-production

# Check logs for errors
kubectl logs <pod-name> --tail=50

# Look for "Missing required environment variable" errors
# If pod starts cleanly, the secret is loaded correctly
```

The secret is now provisioned and ready to use.

---

### Part 2: Implementation PR

**7. Add Validation**

Edit your service's env file:
- Website: `bluedot/apps/website/src/lib/api/env.ts`
- pg-sync: `bluedot/apps/pg-sync-service/src/env.ts`

```typescript
export default validateEnv({
  required: [
    'APP_NAME',
    // ... existing
    'MY_API_KEY',  // ← Add here
  ],
});
```

**8. Use in Code**

```typescript
import env from './env';

const apiKey = env.MY_API_KEY;
// Implement your feature
```

**9. Create PR and Deploy**

After merge, GitHub Actions:
- Builds new Docker image
- Runs `kubectl rollout restart` automatically
- Pods restart and pick up both new code and existing secrets

Feature is now live.

---

### Local Development

Add to `.env.local` in your service directory:

```bash
# bluedot/apps/website/.env.local
# OR bluedot/apps/pg-sync-service/.env.local

MY_API_KEY=test_value_for_local
CHANNEL_ID=C04SAGM4FN1
```

Restart dev server to load changes.

---

## Public Variables (NEXT_PUBLIC_)

**Use for:** Analytics IDs, public URLs, feature flags
**Only for:** website (Next.js)
**Never use for secrets** - visible in browser JavaScript

### How They Work

These are **compiled into JavaScript at build time**, not loaded at runtime:

```
.env.production.template (committed to git)
      ↓
GitHub Actions clones repo (has template)
      ↓
npm run build (Next.js bakes values into JS)
      ↓
JavaScript contains: const id = "GTM-MQGF4XG"  (hardcoded)
      ↓
Docker image has pre-compiled JS
      ↓
Browser downloads JS with baked-in values
```

**Changes require rebuild**, not just pod restart.

### Steps

**1. Add to Templates**

Edit templates (committed to git):

`bluedot/apps/website/.env.production.template`:
```bash
NEXT_PUBLIC_FEATURE_FLAG=true
NEXT_PUBLIC_API_URL=https://api.example.com
```

`bluedot/apps/website/.env.staging.template`:
```bash
NEXT_PUBLIC_FEATURE_FLAG=false
NEXT_PUBLIC_API_URL=https://staging.example.com
```

**2. Use in Code**

```typescript
// No validateEnv needed - build-time constants
const enabled = process.env.NEXT_PUBLIC_FEATURE_FLAG === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

**3. Deploy**

**Staging:**
```bash
git add bluedot/apps/website/.env.staging.template
git commit -m "Update staging feature flag"
git push
# Merge to master → auto-deploys to staging
```

### Local Development

`bluedot/apps/website/.env.local`:
```bash
NEXT_PUBLIC_FEATURE_FLAG=true
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Restart dev server (`npm run dev`).

---

## Manual Pod Restarts Reference

### When Manual Restart is Needed

**Need manual restart:**
- Infra-only changes (adding/updating secrets without code changes)

**No manual restart needed:**
- Service code changes (GitHub Actions restarts automatically)

### Commands

```bash
# One-time setup
cd bluedot/apps/infra
PULUMI_CONFIG_PASSPHRASE_FILE=passphrase.prod.txt \
  pulumi stack output --show-secrets k8sConfig > kubeconfig.yaml
export KUBECONFIG=$(pwd)/kubeconfig.yaml

# Restart deployments
kubectl rollout restart deployment/bluedot-website-production-deployment
kubectl rollout restart deployment/bluedot-pg-sync-service-deployment

# Check status
kubectl rollout status deployment/bluedot-website-production-deployment

# View pods
kubectl get pods | grep bluedot-website-production

# Check logs
kubectl logs <pod-name> --tail=50
```

---

## Quick Reference

### Variable Types

| Type | Defined In | Example | When Loaded |
|------|-----------|---------|-------------|
| Public (browser) | `.env.production.template` | `NEXT_PUBLIC_GTM_ID` | Build time (compiled into JS) |
| Backend secret | `Pulumi.prod.yaml` (encrypted) | `AIRTABLE_PERSONAL_ACCESS_TOKEN` | Container startup |
| Backend non-secret | `serviceDefinitions.ts` | `ALERTS_SLACK_CHANNEL_ID` | Container startup |

### Key Files

| File | Purpose |
|------|---------|
| `infra/Pulumi.prod.yaml` | Encrypted secrets |
| `infra/src/k8s/secrets.ts` | Maps secrets to Kubernetes |
| `infra/src/k8s/serviceDefinitions.ts` | Configures env vars for services |
| `website/.env.production.template` | Public vars for production |
| `website/.env.staging.template` | Public vars for staging |
| `website/src/lib/api/env.ts` | Website validation |
| `pg-sync-service/src/env.ts` | pg-sync validation |

### Required vs Optional

```typescript
// Required - app crashes if missing
required: ['PG_URL', 'KEYCLOAK_CLIENT_SECRET']

// Optional - app uses default if missing
optional: ['PORT']

// In code:
const port = env.PORT ? parseInt(env.PORT) : 8080;
```

---

## Troubleshooting

### "Missing required environment variable" on startup

**Local:**
- Add to `.env.local`
- Restart dev server

**Production:**
- Check if infra PR was merged
- If merged, did you restart pods?
- Check pod logs: `kubectl logs <pod-name>`

### NEXT_PUBLIC_* not updating

**Symptoms:** Browser shows old value

**Cause:** Build-time variable, requires rebuild

**Solution:**
- Update template and merge
- For production: create new tag to trigger rebuild
- Clear browser cache (Cmd+Shift+R)

### Can't run npm run config:secret

**Error:** Missing passphrase

**Solution:**
- Get from 1Password
- Save to `bluedot/apps/infra/passphrase.prod.txt`

### Variable not in production after merge

**Remember:**
- Merge to master → **staging only**
- Create tag `website/v*` → **production**

### Pod fails to start after adding variable

**Check:**
1. Is variable in `serviceDefinitions.ts`?
2. Is variable in service's `env.ts` validation?
3. Check pod logs: `kubectl logs <pod-name>`
4. Common issue: typo in variable name (case-sensitive)

---

## Understanding validateEnv

`validateEnv` is a shared utility from `@bluedot/utils`. Each service calls it with its own requirements:

```
Library provides:
  @bluedot/utils/validateEnv  ← Implementation

Services configure:
  website/src/lib/api/env.ts       → validateEnv({ required: ['KEYCLOAK_SECRET'] })
  pg-sync-service/src/env.ts       → validateEnv({ required: ['PG_URL'] })
```

Each service declares only what it needs. App crashes at startup if required variables are missing, providing immediate feedback.

---

## Why Environment Variables Need Pod Restarts

**Key concept:** Environment variables are set when a container starts. Kubernetes doesn't update running containers when secrets change.

This means:
- Update a secret in Kubernetes → running pods still have old values
- Pod must restart to read the new values

**When pods restart automatically:**
- Service code changes (website, pg-sync-service) → GitHub Actions builds new image and runs `kubectl rollout restart`

**When pods DON'T restart automatically:**
- Infra-only changes → GitHub Actions runs `pulumi up` but NOT `kubectl rollout restart`
- You must manually restart pods (or make a trivial service code change to trigger automatic restart)
