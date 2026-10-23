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
import { Button, /* etc. */ } from '@bluedot/ui';
```

## Components

Use these before you build anything. Browse them in [Storybook](https://storybook.k8s.bluedot.org) (local: `cd apps/storybook && npm start`). Get props and variants from the component source and its story. Tokens are documented in [`GettingStarted.mdx`](../../apps/storybook/src/GettingStarted.mdx).

| Need | Use | Not |
| --- | --- | --- |
| Button or CTA link | `Button` | Styled `<a>`/`<button>`; className colour overrides (use `variant`/`tone`) |
| Icon-only action | `IconButton` | `Button` with only an icon |
| Low-emphasis text action (Show more, Clear, Undo) | `Button variant="link"`, `tone="accent"` for the blue one | Underlined `<button className>` |
| Unstyled clickable wrapper | `ClickTarget` | Hand-rolled link-or-button switch |
| Headings, body text, links | `H1`–`H4`, `P`, `A` | Raw `<h2 className="text-...">` |
| Small label above a heading | `Eyebrow` | Uppercase `<span>` with custom tracking |
| Page hero | `HeroSection`, `HeroH1`, `HeroCTAContainer` | |
| Page section | `Section`, `SectionHeading` | |
| Card | `Card`, `CardShell` (static shell for custom content) | Bordered `<div>` |
| List of link rows | `ListRow` in `ListGroup` | `Card` per row; hand-rolled dividers |
| Inline notice or error | `Callout` | `toast` for persistent info; hand-rolled coloured boxes |
| Error from a failed query | `ErrorSection` | |
| Transient feedback | `Toaster` + `toast()` | `Callout` |
| Modal or bottom sheet | `Modal` (sheet on mobile), `ModalTitle` | Custom overlay |
| Menu of actions | `OverflowMenu` | |
| Tooltip | `Tooltip` | Native `title` for meaningful content |
| Show/hide | `Collapsible` | Hand-rolled `useState` disclosure |
| Tabs / filter pills | `TabPills` | |
| Breadcrumbs | `Breadcrumbs`, `BreadcrumbTrail` | |
| Status or category label | `Tag` | |
| Avatar | `Avatar` | `<img className="rounded-full">` |
| Loading indicator | `ProgressDots`; `Button` `loading` prop | Spinner icons |
| Carousel | `SlideList` | |
| Share | `ShareButton` | |
| Label, description, error around a control | `Field`; `FieldSet` for checkbox/radio groups | Hand-rolled `<label>` + error `<p>` |
| Text input | `Input` (leading/trailing slots) | Raw `<input>` |
| Search | `SearchInput` | `Input` with a hand-rolled icon and clear button |
| Multi-line text | `Textarea` | |
| Checkbox, radio | `Checkbox`, `Radio` | Raw `<input type="checkbox">` |
| Dropdown | `Select` | Native `<select>` |
| Date, time | `DatePicker`, `TimePicker` | Native `type="date"`/`"time"` |
| On/off setting | `ToggleSwitch` | Checkbox styled as a switch |
| Availability grid | `TimeAvailabilityGrid` | |
| Feedback form | `FeedbackModal` | |
| Footer | `Footer` | |
| Icons | `react-icons/fa6`, imported directly. See [`DEVELOPMENT_HANDBOOK.md` → Icons](../../DEVELOPMENT_HANDBOOK.md#icons) | Other icon families; custom SVG when a Font Awesome glyph exists |
| Class merging | `cn` | String concatenation |

### Overrides

- Use the component defaults first.
- Text primitives (`H1`–`H4`, `P`, `A`, `Eyebrow`): you can set colour and size with semantic tokens (`text-secondary`, `text-on-dark-secondary`, `text-size-md`). Don't re-add weight, leading or tracking.
- Text size floor: `text-size-xs` (14px) for anything people read, including helper, error and meta text. `text-size-xxs` (12px) is only for tags, chips and eyebrows, and only semibold or uppercase.
- All other components: use `className` for layout (margin, width, grid or flex placement). Colour comes from props. On a dark surface, set `data-on-dark` on the container.
- A visual override (colour, size, padding, radius, border) needs a reason in the PR. If several callers need the same override, add a variant or prop to the shared component instead.
- Build a bespoke component only when no existing component fits. Use tokens only, and say in the PR why.

## Utilities

### Environment Validation

In `src/lib/api/env.ts`, you'll have something like:

```typescript
import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'DATABASE_URL',
    'API_KEY',
  ]
});

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
import { makeMakeApiRoute, verifyKeycloakToken } from '@bluedot/ui/src/api';
import env from './env';

export const makeApiRoute = makeMakeApiRoute({
  env,
  // Two options:
  // 1. verifyKeycloakToken, for BlueDot customers via login.bluedot.org
  // 2. verifyGoogleBlueDotToken, for BlueDot staff via Google
  verifyAndDecodeToken: verifyKeycloakToken,
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
import { withAuth, Button } from '@bluedot/ui';
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
      <Button onClick={() => setAuth(null)}>Log out</Button>
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
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
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
import { logger } from '@bluedot/ui/src/api';

logger.warn('(chuckles) I\'m in danger');
logger.error('Things went kaboom:', err);
