# BlueDot UI Library

A shared UI components and utilities for BlueDot apps.

## Setup

1. Install the `@bluedot/ui` dependency in your package.json:
```diff
   "dependencies": {
+    "@bluedot/ui": "*",
   }
```
2. Import any of the features from `@bluedot/ui`, e.g.:
```typescript
import { Button, makeMakeApiRoute, /* etc. */ } from '@bluedot/ui';
```

## Components

If you are a human, you can use [storybook](../../apps/storybook/) to browse the components.

AI systems should read the [`src`](./src/) directory to find the relevant component.

## Utilities

### Environment Validation

In `src/lib/api/env.ts`, you'll have something like:

```typescript
import { validateEnv } from '@bluedot/ui';

const env = validateEnv([
  'APP_NAME',
  'DATABASE_URL',
  'API_KEY',
]);

export default env;
```

Then in other files you can import and use environment variables, e.g.:

```typescript
import env from './env';

console.log(`Is this the Krusty Krab? NO,THIS IS ${env.APP_NAME}!!!!`);
```

### API Route Creation

In `src/lib/api/makeApiRoute.ts`, you'll have something like:

```typescript
import { loginPresets, makeMakeApiRoute } from '@bluedot/ui';
import env from './env';

export const makeApiRoute = makeMakeApiRoute({
  env,
  // Two options:
  // 1. keycloak, for BlueDot customers via login.bluedot.org
  // 2. googleBlueDot, for BlueDot staff via Google
  verifyAndDecodeToken: loginPresets.keycloak.verifyAndDecodeToken,
});
```

Then in your actual API routes you'll use this helper:

```typescript
import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { groupTable } from '../../../lib/api/db/tables';

// Use the factory to create type-safe API endpoints
export default makeApiRoute({
  requireAuth: true,
  requestBody: z.optional(z.object({
    filter: z.string(),
  })),
  responseBody: z.array(z.object({
    name: z.string(),
  })),
}, async (body, { auth }) => {
  if (auth.email !== 'admin@bluedot.org') {
    throw new createHttpError.Unauthorized('Only the admin can see this');
  }

  const allGroups = await db.scan(groupTable);

  if (body?.filter) {
    return allGroups.filter((group) => group.name.includes(body.filter));
  }

  return allGroups;
});
```

### Authentication

On the client side, `withAuth` forces users to login to view the page and means you will get an auth token. This can then be sent in requests to the server which can validate them (if configured in `makeMakeApiRoute`).

```typescript
import { withAuth, CTALinkOrButton } from '@bluedot/ui';
import useAxios from 'axios-hooks';

const GroupsPage = withAuth(({ auth, setAuth }) => {
  // auth.token - JWT token
  // auth.expiresAt - Expiration timestamp
  const [{ data, loading, error }] = useAxios<{ name: string }[]>({
    method: 'get',
    url: '/api/groups',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return (
    <>
      <div className="grid md:grid-cols-4 gap-4">
        {loading && !data && <p>Loading...</p>}
        {data?.map((group) => (
          <p>{group.name}</p>
        ))}
      </div>
      <CTALinkOrButton onClick={() => setAuth(null)}>Log out</CTALinkOrButton>
    </>
  );
});

export default GroupsPage;
```

#### Login pages

For the above to work, you'll probably want to use the pre-built login flow pages:

```typescript
// In src/pages/login/index.tsx
import { LoginRedirectPage, loginPresets } from '@bluedot/ui';

// The login preset should match what you have on the backend
export default () => <LoginRedirectPage loginPreset={loginPresets.keycloak} />;
```

```typescript
// In src/pages/login/oauth-callback.tsx
import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';

export default () => <LoginOauthCallbackPage loginPreset={loginPresets.keycloak} />;
```

### Error Coercion

```typescript
import { asError } from '@bluedot/ui';

type MyComponentProps = {
  error: unknown
};

const MyComponent: React.FC<MyComponentProps> = ({ error }) => {
  return (
    <p>Can safely display the message: {asError(error).message}</p>
  );
};
```

### Slack Alerting

```typescript
import { slackAlert } from '@bluedot/ui';
import env from './env';

// Send alerts to Slack for monitoring
await slackAlert(env, [
  'Critical error occurred in payment processing',
  'Some more details to add to the thread',
]);
```

### Logging

Use `logger`, not `console`. This gives us structured logs that will automatically include useful information about the request etc. when in production.

```typescript
import { logger } from '@bluedot/ui';

logger.warn('(chuckles) I\'m in danger');
logger.error('Things went kaboom:', err);
```
