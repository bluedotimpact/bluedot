
## Utils

A collection of shared utilities, ideally ones that are not frontend-specific.

### Environment Validation

In `src/lib/api/env.ts`, you'll have something like:

```typescript
import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'DATABASE_URL',
    'API_KEY',
  ],
});


export default env;
```

Then in other files you can import and use environment variables, e.g.:

```typescript
import env from './env';

console.log(`This app is ${env.APP_NAME}`);
```

### Test config

Create a `vitest.config.mjs` in new packages that looks like this:

```typescript
import { withDefaultBlueDotVitestConfig } from '@bluedot/utils/src/default-config/vitest.mjs';

export default withDefaultBlueDotVitestConfig();
```
