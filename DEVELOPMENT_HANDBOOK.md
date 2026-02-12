# Bluedot Development Handbook

## Executive Summary

Welcome to Bluedot! This handbook consolidates our development patterns and helps new team members transition smoothly. Our tech stack includes:

- **Frontend**: Next.js, React, Tailwind CSS, Axios (currently, considering alternatives)
- **Backend**: Next.js API routes, Airtable (source of truth), PostgreSQL (read replica)
- **Authentication**: Keycloak
- **Deployment**: Pulumi, Kubernetes, nginx

### Quick Start Checklist
- [ ] Request Airtable access and create personal access token
- [ ] Get production PG_URL from Bluedot team member (Joshua most likely)
- [ ] Set up local development environment
- [ ] Be aware of Component Library in `libraries/ui` - reuse these components whenever possible
- [ ] Read Section 4: Development Standards

### Philosophy
*From Martin*: Practicality - get 80% of the benefit for 20% of the extra work.
---

## 1. Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Getting Started](#3-getting-started)
4. [Development Standards](#4-development-standards)
   - 4.1 [Frontend Standards](#41-frontend-standards)
   - 4.2 [Backend Standards](#42-backend-standards)
   - 4.3 [Database Guidelines](#43-database-guidelines)
   - 4.4 [Technical Proposals & RFCs](#44-technical-proposals--rfcs)
5. [Component Library](#5-component-library)
6. [Deployment & DevOps](#6-deployment--devops)
7. [Appendices](#7-appendices)

---

## 2. Architecture Overview

### System Architecture

```
╔═════════════╗     ╔═════════════╗     ╔═════════════╗
║   Browser   ║────►║   Next.js   ║────►║  Airtable   ║
║             ║     ║   Website   ║     ║   (Write)   ║
╚═════════════╝     ╚══════╤══════╝     ╚══════╤══════╝
                           │                   │
                           ▼                   ▼
                    ╔═════════════╗     ╔═════════════╗
                    ║ PostgreSQL  ║◄────║ Replication ║
                    ║   (Read)    ║     ║   Service   ║
                    ╚═════════════╝     ╚═════════════╝
```

### Key Components

- **apps/website**: Main user-facing application (what users see when visiting bluedot.org)
- **libraries/ui**: Shared React components following Bluedot branding
- **apps/storybook**: Component documentation and visual testing
- **apps/login**: Keycloak integration

### Why Two Databases?

- **Airtable (Source of Truth)**:
  - Excellent CRM for technical and non-technical users
  - Easy to explore, visualize, and build automations
  - Handles reliability and uptime for us
  
- **PostgreSQL (Read Replica)**:
  - Solves Airtable's performance limitations (500ms+ latency)
  - No rate limiting issues
  - Enables faster page loads

**Important**: Reads go to PostgreSQL, writes go to Airtable + PostgreSQL

---

## 3. Getting Started

### Prerequisites Checklist

- [ ] Node.js installed
- [ ] npm configured
- [ ] Git access to bluedot repository
- [ ] Airtable account with API access (request this)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bluedotimpact/bluedot.git
   cd bluedot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the template and rename it
   cp .env.template .env.local
   
   # Then update with your values:
   AIRTABLE_API_KEY=your_personal_access_token
   PG_URL=get_from_bluedot_team_member
   ```

4. **Configure Airtable Access**
   - Request access to production Airtable base
   - Create personal access token with appropriate permissions
   - See the Slack channel for contractors for detailed setup instructions

5. **Run development server**
   ```bash
   cd apps/website
   npm run dev
   ```

### Test Resources

#### Test Course
Every user is automatically enrolled in a test course that can be accessed at:
- **URL**: http://bluedot.org/courses/test-course

This is particularly helpful when you're modifying course components and want to see how they look without needing to enroll in a specific course or manipulate test data.

**Use cases**:
- Testing course UI components
- Verifying course navigation flow
- Testing course-specific features without affecting real courses
- Quick visual checks during development

### Common Issues & Solutions

#### PG_URL Required Error
**Problem**: Created a branch where PG_URL is required but development experience isn't finalized. If you're a contractor, just ask for PG_URL from Joshua.
**Workaround?**: Use an older master branch where PG_URL isn't required yet (temporary solution until #1060 is complete)

#### Airtable Performance (FYI)
**Context**: 
- Official limit: 5 req/s per base
- Unofficial: Can burst to 50 req/s for short periods
- High latency: frequently 500ms+ per request
- Note: This is informational - no specific action required

#### Debugging React Components
**Tip**: If you're having trouble finding React components in the browser inspector, install the React Developer Tools Chrome extension: https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en

---

## 4. Development Standards

### 4.1 Frontend Standards

#### When to Create Components vs Pages (Next.js)

**General idea**: If a page needs to hold state, consider separating that component out and calling that new component from the page.

**What Pages Should Do**:
* **SEO stuff**: Next.js `<Head>`: title, metadata and JSON-LD schemas
* **API calls**: It's fine to need these
* **Conditional rendering**: At most, render different components based on an API call

**When to Make a New Component:**
* When you need to manage state
* When things get complex
* When you might reuse it somewhere else

| Scenario | Page | Component | Explanation |
|----------|------|-----------|-------------|
| Needs SEO (e.g., `<Head>`, metadata, JSON-LD) | ✅ Yes | ❌ No | SEO logic belongs at the page level in frameworks like Next.js |
| Is linked to via routing (e.g., /dashboard, /profile) | ✅ Yes | ❌ No | Pages represent routes in the application (especially in file-based routing) |
| Makes API calls | ✅ Yes | ✅ Yes | Both pages and components may encapsulate API calls. Pages may switch between components based on API responses |
| Needs to manage its own local state | ❌ No | ✅ Yes | Create a component if it manages state internally |
| Is getting large or complex | ❌ No | ✅ Yes | Break it into a component for better readability and maintainability |
| Might be reused elsewhere in the app | ❌ No | ✅ Yes | Reusable UI logic or elements should live in components |

**💡 Rule of thumb**: Pages should orchestrate and compose components. Components should encapsulate behavior, state, and reusable UI.

#### Component Organization

**Current Pattern**:
- Keep everything in same file unless obviously reusable
- Only have one export (the topmost component)
- Topmost component handles orchestration
- Sub-components should be self-reliant (handle own API calls and logic)

#### Error Handling

**⚠️ Note**: Current error handling uses axios with `parseZodValidationError`, but we're investigating replacements. Note that React Query/tRPC proposals below solve data fetching but not error display - for that, see the toast proposal in [Open Questions](#appendix-a-open-questions-registry).

**Current Pattern for API Errors**:
```tsx
try {
  const response = await axios.post('/api/profile/update', data);
  // handle success
} catch (err) {
  if (!axios.isAxiosError(err)) {
    setNameError('Failed to update name. Please try again.');
    return;
  }

  if (err.response?.status === 401) {
    setNameError('Session expired. Please refresh the page and try again.');
    return;
  }

  if (err.response?.status === 400) {
    setNameError(parseZodValidationError(err, 'Invalid name format'));
    return;
  }

  setNameError('Failed to update name. Please try again.');
} finally {
  setIsSaving(false);
}
```

The `parseZodValidationError` function from `lib/utils.ts` parses backend error JSON to provide human-readable strings.

#### Styling Guidelines

**Use Tailwind CSS** - This is our standard approach

**History**: We previously used BEM (Block Element Modifier) naming conventions in our codebase, but found it didn't provide additional benefits over Tailwind's utility classes. BEM added verbosity without solving problems that Tailwind already handles.

```tsx
// ✅ CORRECT - Use Tailwind with proper accessibility for testing
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <label className="text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input 
    type="email"
    aria-label="Email Address"
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  />
  <button 
    aria-label="Save email changes"
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Save
  </button>
</div>

// ❌ INCORRECT - Don't use BEM (our old approach)
<div className="profile-account-details__title">
  <input className="profile-account-details__input" />
</div>
```

**Note**: The `aria-label` attributes above make elements easily selectable in tests using React Testing Library.

**Decision**: We moved away from BEM to Tailwind for cleaner, more maintainable styles.

#### Handling image assets

We keep images in the codebase and rely on manual optimisation rather than using `next/image`. The site isn't very image-heavy, so this keeps things simple and gives us full control over image quality and size when needed.

For images referenced from outside the codebase itself (in Airtable data fields), place them under `public/images/content/`. This is so
devs know to be more careful about deleting those images, as they might
be referenced elsewhere.

**How to optimize images:**

You should generally aim to get all images under 200kB. This is usually achievable unless you need a very large detailed image.

1. **Convert to WebP** using ImageMagick:
   ```bash
   magick input.png -quality 85 output.webp
   ```

2. **If still over 200KB**, resize to 2x the maximum rendered width:
   ```bash
   magick input.png -resize WIDTHx -quality 85 output.webp
   ```
   For example, if an image displays at max 400px wide, use `-resize 800x`.

3. **Update references** in code to use the new `.webp` filename and delete the old version.

4. **(Optional) For hero/banner images** that appear above the fold, add `{...{ fetchpriority: 'high' }}` to the `<img>` tag to improve Largest Contentful Paint. *Don't* do this if the image doesn't appear above the fold.

If you don't have ImageMagick installed, run `brew install imagemagick` on mac.

#### Testing Standards

**Testing Philosophy**: We follow React Testing Library best practices - "The more your tests resemble the way your software is used, the more confidence they can give you."

**Component Accessibility Checklist**

The following practices make your components easily testable by allowing React Testing Library to find elements the way users would:

- [ ] All interactive elements have unique accessible names (text or aria-label)
- [ ] Generic actions include context ("Delete" → aria-label="Delete user John")
- [ ] Form inputs have unique labels ("Name" → "Billing Name")
- [ ] Repeated elements in loops include identifying data in aria-labels
- [ ] Icon-only buttons have descriptive aria-labels
- [ ] Links use descriptive text, not "click here"
- [ ] Use semantic HTML (button, nav, main) over generic divs

**Testing Query Priority (Simplified)**

When writing tests, use queries in this order to match how users interact with your app:

1. **getByRole** - Your first choice for almost everything (with name option)
2. **getByLabelText** - Best for form fields
3. **getByPlaceholderText** - If no label is available
4. **getByText** - For non-interactive elements (divs, spans, paragraphs)
5. **getByDisplayValue** - For filled-in form values

Avoid `getByTestId` and `querySelector` - they don't reflect user behavior.

Full details: https://testing-library.com/docs/queries/about/#priority

**Example: How These Help Testing**
```tsx
// Component with good accessibility
<form>
  <input 
    type="email" 
    aria-label="Email Address"
    placeholder="Enter your email"
  />
  <button aria-label="Save profile changes">
    Save
  </button>
</form>

// Now easily testable with React Testing Library
test('user can update their email', async () => {
  render(<ProfileForm />);
  
  // Find elements the way a user would
  const emailInput = screen.getByLabelText('Email Address');
  const saveButton = screen.getByRole('button', { name: 'Save profile changes' });
  
  // Simulate user actions
  await userEvent.type(emailInput, 'new@email.com');
  await userEvent.click(saveButton);
  
  // Verify user sees success
  expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
});
```

**Query Priority (Test Like a User)**:
```tsx
// ✅ PREFERRED - How users interact (in order of preference)
getByRole('button', { name: 'Save email changes' })  // With specific aria-label
getByLabelText('Email Address')
getByText('Welcome back!')

// ⚠️ AVOID - Implementation details
getByTestId('save-button')  // Only for dynamic content
container.querySelector('.btn-primary')  // Never use
```

**Consider for Every Component**:

The general idea is that you get how it's supposed to look from a snapshot test, then you confirm that it does what it should through functional tests.

1. **Snapshot Test**
   - Full output snapshot of default render
   - Purpose: Catch HTML/CSS regressions

2. **Functional Tests**
   - Test complete user flows (e.g., "user can update their profile")
   - Mock API responses but focus on what the user experiences
   - Verify UI updates correctly from the user's perspective
   - Ensure error states are shown to users appropriately

**Example Test Structure**:
```tsx
describe('UserProfile', () => {
  // 1. Snapshot test
  it('renders correctly with minimal props', () => {
    const { container } = render(<UserProfile userId="123" />);
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with all props', () => {
    const { container } = render(
      <UserProfile 
        userId="123" 
        showBadges={true} 
        enableEdit={true}
        initialTab="achievements" 
      />
    );
    expect(container).toMatchSnapshot();
  });

  // 2. Functional tests - test user flows, not implementation
  it('user can successfully update their profile name', async () => {
    // Mock the API response
    server.use(
      rest.post('/api/profile/update', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );
    
    render(<UserProfile userId="123" />);
    
    // User clicks edit button
    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    
    // User types new name
    const nameInput = screen.getByLabelText('Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');
    
    // User saves changes
    await userEvent.click(screen.getByRole('button', { name: 'Save profile changes' }));
    
    // User sees success message
    expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    
    // Form returns to view mode
    expect(screen.queryByRole('button', { name: 'Save profile changes' })).not.toBeInTheDocument();
    expect(screen.getByText('New Name')).toBeInTheDocument();
  });

  it('user sees error message when update fails', async () => {
    // Mock API failure
    server.use(
      rest.post('/api/profile/update', (req, res, ctx) => {
        return res(ctx.status(400));
      })
    );
    
    render(<UserProfile userId="123" />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save profile changes' }));
    
    // User sees error message
    expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
  });
});
```

### 4.2 Backend Standards

#### API Design

**Route Structure**: Based on objects/nouns in database (not features)
- Example: "profile" page pulls from both `/api/courses` and `/api/users`

**File Naming Convention**:
- New routes should use `index.ts`
- Files like `api/users/me.ts` should probably just be index.ts

#### Validation

**⚠️ Note**: The previous team questioned the maintenance work of keeping separate Zod schemas and preferred to just validate on the backend. However, Martin's opinion is to have the shared schema that both frontend and backend can use.

**Shared Validation with Zod**:
- Place schemas in `website/src/lib/schemas`
- Follow backend folder structure
- Example: `src/pages/api/profile/me.ts` → `lib/schemas/profile/me.schema.ts`

```typescript
// Both frontend and backend can use the same schema
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});
```

#### Testing Backend

**Current State**: We don't test the backend - only frontend tests that mock API requests.

**Martin's Opinion**: 
- Prefers integration tests using real services
- Creating local Airtable might not be accurate or worth it

Adam's proposal: "I think now we have everything flowing through @bluedot/db it should be fairly possible to have a fake in-memory db for tests (either something simple our own, or something like PGlite if we want to properly support pg queries)?"

This is currently an open question - see [Open Questions Registry](#appendix-a-open-questions-registry) for details.

### 4.3 Database Guidelines

#### Current Architecture

- **Source of Truth**: Airtable
- **Reads**: PostgreSQL replica
- **Writes**: Airtable + PostgreSQL sync
- **Primary Key**: User's email address (in Keycloak)

#### Database Migrations

**How migrations work**:

In `@bluedot/db`:
1. Edit `schema.ts` to change table definitions
2. `pg-sync-service` picks up changes
3. Applies them to database (using Drizzle)
4. Starts syncing the changes

**Migration Best Practices**:

**Removing a column**:

You need to make two PRs:
1. PR 1:
  a. Remove any usage of the column
  b. Move it to `deprecatedColumns` in `libraries/db/src/schema.ts`. This will stop the application code from SELECT-ing it, but it won't be dropped from the database
  c. Merge this, *and* deploy to production
2. PR 2:
  a. Delete the column fully from `libraries/db/src/schema.ts`. This will cause it to be dropped from the database as soon as the PR is *merged* (not when it is released to production)
  b. Ensure PR 1 is deployed to production (merged to master + release created) before merging this. If you're feeling generous also wait for other developers to pull in PR 1 first

**Adding a column**:

You need to make two PRs:
1. PR 1:
  a. Add the column in `libraries/db/src/schema.ts`
  b. Merge this (no need to deploy to production)
2. PR 2:
  a. Start using the column in code

**Note**: Since Airtable is source of truth, PostgreSQL issues aren't catastrophic, but we should still avoid breaking prod data.

### 4.4 Technical Proposals & RFCs

#### Active Proposals

##### 4.4.1 Frontend Data Fetching Strategy
**Status**: 🟡 Under Discussion  
**Context**: Current axios + parseZodValidationError approach has limitations

###### Current Problems
1. **Redundant API calls**: Multiple components requesting same data
2. **Manual cache management**: Components don't update after mutations
3. **Verbose error handling**: Repetitive try/catch blocks everywhere
4. **No optimistic updates**: Poor UX for mutations

###### Proposed Solutions

**Option A: React Query (TanStack Query)** - Lower commitment, immediate benefits
```typescript
// Example: Automatic request deduplication and caching
const { data, error, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

// Automatic cache invalidation
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});
```

Benefits:
- Eliminates duplicate requests automatically
- Components auto-update after mutations
- Built-in loading/error states
- Works with existing REST API
- **No backend changes required**

Drawbacks:
- No end-to-end type safety
- Still need manual Zod validation on frontend

**Option B: tRPC** - Higher commitment, more benefits
```typescript
// End-to-end type safety
const { data, error } = trpc.user.getById.useQuery({ id: userId });
```

Benefits:
- Type safety from backend to frontend
- No more manual Zod parsing on frontend
- Built on React Query (includes all React Query benefits)
- Standardized error responses

Drawbacks:
- **Requires significant backend rewrite**
- Larger architectural change
- Team needs to learn new patterns

**Note**: These aren't mutually exclusive - we could adopt React Query first for immediate benefits, then migrate to tRPC later if we want end-to-end type safety.

###### Next Steps
- [ ] Gather team feedback
- [ ] Create proof-of-concept branch
- [ ] Estimate migration effort
- [ ] Make decision

---

## 5. Component Library

### Storybook

**What it is**: View components individually without navigating to specific pages or triggering states manually

**Access**:
- Production: https://storybook.k8s.bluedot.org/
- Local: `cd apps/storybook && npm start` (port 6006)

### Usage Guidelines

All components in `libraries/ui` follow Bluedot branding. **Always reuse these components instead of creating new ones when possible.**

---

## 6. Deployment & DevOps

### Infrastructure
- **Platform**: Kubernetes with nginx on Vultr
- **Infrastructure as Code**: Pulumi (`apps/infra`)
- **Observability**: OpenTelemetry, Grafana

### Clearing the CI cache

If CI is behaving strangely (e.g. tests pass locally but fail in CI, or you're seeing errors about missing dependencies), try clearing the CI cache: go to [Actions → Clear CI/CD Cache → Run workflow](https://github.com/bluedotimpact/bluedot/actions/workflows/clear_cache.yaml).

### Force deploying the website

Production deploys normally require CI/CD to have passed on the tagged commit. To bypass this in an emergency, go to [Actions → website_deploy_production → Run workflow](https://github.com/bluedotimpact/bluedot/actions/workflows/website_deploy_production.yaml), select the tag to deploy, and tick "Skip CI/CD check".

### Deployment Processes

#### Website
- Production deployment: See `apps/website/README.md#production`

#### Login App
- See: `apps/login#deployment`

#### Keycloak Theme Updates
- Update version in: `apps/login/tools/getBluedotKeycloakTheme.sh`

#### Postgres Deployment
- Undocumented

### Authentication
- Production Keycloak instance for auth/password management
- No password info stored in Airtable
- Can run locally through "login" app
- Custom theme available in bluedot-keycloak-theme repo which can be used instead of the "login" app

### Observability Stack Data Flow

```
 +--------------+
 | Applications |
 +--------------+
         |
         | (metrics, logs)
         v
 +---------------+
 | OpenTelemetry |
 |   Collector   |
 +---------------+
      |       |
      |       +------------------+
      |                          |
      | (metrics)                | (logs)
      v                          v
 +------------------+    +---------------+
 | Prometheus       |    | Loki          |
 | (metric storage) |    | (log storage) |
 +------------------+    +---------------+
      |                          |
      |                          |
      +---------------+----------+
                      |
                      v
           +----------------------+
           |       Grafana        |
           | (dashboards, alerts) |
           +----------------------+
```
#### Data Flow:
 1. There are multiple applications, across multiple kubernetes nodes. These produce metrics and logs.
    - Metrics are sent via the OpenTelemetry SDK to a collector. In Next.js apps this is set up with instrumentation.ts.
    - Logs are sent by logging them to stdout (e.g. with console.log or Winston). Kubernetes automatically saves these logs to files.
 2. The OpenTelemetry Collector collects these metrics and logs, enriches them, and sends them on to Prometheus and Loki.
    - It operates on every node (computer) in the Kubernetes cluster
    - For metrics, it hosts a HTTP server using the OTLP standard which apps can send metrics to
    - For logs, it collects logs from Kubernetes's saved log files
    - It also adds some metadata, e.g. what service and node the metrics or logs are from
    - It then sends the enriched metrics and logs data on to Prometheus and Loki
    - The reason we use the OpenTelemetry Collector, instead of apps sending directly to Prometheus and Loki, is:
      - For custom apps, we can add custom code to send logs and metrics to the right servers. But for off-the-shelf software (e.g. nginx), we can't do this - so need something to collect logs etc.
      - Even for our custom apps, with the OTel collector we can easily change where we want to send logs and metrics, without making code changes to every app. This allows us to easily experiment to find the best tools, and avoids vendor lock-in.
      - The collector enriches the data, so that the data is easier to use.
 3. Prometheus and Loki store and index metrics and logs respectively
 4. Grafana queries both Prometheus and Loki to create dashboards and alerts
    - Developers can login to view the data at grafana.k8s.bluedot.org

---

## 7. Appendices

### Appendix A: Open Questions Registry

| Question | Context | Priority |
|----------|---------|----------|
| Toast notifications for errors? | Simple 80/20 solution for better error handling UX | High |
| React Query adoption? | Solve redundant API calls, manual cache management, no backend changes needed | High |
| tRPC adoption? | End-to-end type safety, standardized error responses, requires backend rewrite | Medium |
| Backend testing approach? | Currently no backend tests. Adam's proposal: fake in-memory DB or PGLite for tests | Medium |

### Appendix B: Established Decisions

| Decision | Rationale |
|----------|-----------|
| No BEM naming, use Tailwind | BEM didn't provide additional benefits over Tailwind's utility classes |
| Follow React Testing Library best practices | Tests should resemble how users interact with the software |
| Snapshot + functional tests required | Catches regressions and ensures functionality |
| Airtable + PostgreSQL architecture | Best of both worlds - CRM features + performance |

### Appendix C: FAQ

#### Development Issues

**Q: How do I update bluedot-keycloak-theme?**  
A: Update the version in `apps/login/tools/getBluedotKeycloakTheme.sh`

**Q: What about local development without production data?**  
A: Currently requires production Airtable. Local setup is a known limitation.

### Appendix D: Glossary

- **Base**: Database in Airtable terminology
- **QPS**: Queries Per Second

---

## Contributing

This is a living document meant to capture our actual practices and ongoing discussions. Feel free to add comments and suggestions!

*Currently maintained by Martin but go ahead and make PRs*
