# BlueDot Website

Quick links:
- [Production version](https://bluedot.org/)
- [Staging version](https://website-staging.k8s.bluedot.org/)
- [Storybook](https://storybook.k8s.bluedot.org/)
- [Designs](https://www.figma.com/design/s4dNR4ELGKPbja6GkHLVJy/Website-Laura's-Working-File)

## Tech Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Testing**: Vitest (Jest) + React Testing Library
- **Component Development**: Storybook
- **Deployment**: Kubernetes (via GitHub Actions)

## Project Structure

Non-exhaustive — only the most-touched paths are listed.

```
apps/website/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Next.js pages and API routes (pages router)
│   ├── lib/
│   │   ├── api/        # Server-side API helpers (auth, env, db, route wrappers)
│   │   └── ...         # Client/shared helpers (routes, utils, fonts, schemas)
│   ├── hooks/          # Custom React hooks
│   ├── server/         # Server-only modules
│   ├── stores/         # Zustand stores
│   ├── utils/          # Misc client-side utilities
│   ├── types/          # Shared TypeScript types
│   ├── middleware.ts   # Next.js middleware
│   ├── instrumentation.ts # Next.js instrumentation hook
│   └── globals.css     # Custom Tailwind CSS styles
├── public/             # Static assets (incl. /fonts)
└── scripts/            # Build-time scripts (sitemap, preview rendering)
```

## Developer Setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions).

Common scripts (run from `apps/website/`):

```bash
npm run start         # next dev on http://localhost:8000
npm run build         # next build (also generates sitemap)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (no warnings allowed)
npm run lint:fix      # eslint --fix
npm run test          # vitest --run
npm run test:watch    # vitest in watch mode
npm run test:update   # update vitest snapshots
npm run render-preview # render OG/preview images
```

## Common Development Tasks

### Adding a New Page

1. Create a new file in `src/pages/`
2. Add the route to [the nginx template in website-proxy](../website-proxy/src/nginx.template.conf)
3. Update the navigation if needed
4. Add tests for the new page

### Creating a New Component

1. Create the component `.tsx` file in `src/components/`
2. Add a Storybook story `.stories.tsx`
3. Write tests in `.test.tsx` and run snapshots via `npm run test:update`
4. Use Tailwind classes for styling and BEM classes for identification

### Making API Changes

1. Add the route handler under `src/pages/api/` (Next.js pages-router API routes)
2. Reuse server-side helpers from `src/lib/api/` (auth, env, `makeApiRoute`, etc.)
3. For database access, use the shared `@bluedot/db` package (unified Airtable + Postgres via airtable-ts and Drizzle ORM) — don't bypass it

## Storybook

We use [Storybook](https://storybook.js.org/) to develop and test UI components.

To run the [Storybook app](../storybook/README.md) locally:

```bash
# from the root of the repo
npm run start --workspace=apps/storybook
```

Our storybook is deployed to [https://storybook.k8s.bluedot.org](https://storybook.k8s.bluedot.org).

## Production Proxy

Traffic to the production site (https://bluedot.org) is routed through the [website-proxy](../website-proxy/README.md) app.

**Important:** When adding a new page, you must also add it to [the nginx template in website-proxy](../website-proxy/src/nginx.template.conf).

## Troubleshooting

### Common Issues

1. **Build fails locally**
   - Clear the `.next` directory: `rm -rf .next`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`

2. **Storybook not loading**
   - Ensure you're running from the root directory
   - Check if the Storybook workspace is properly configured

## Deployment

This app follows a **multistage** deployment process. For more details, see [docker-scripts](../../libraries/docker-scripts/README.md).

### Staging

To deploy to staging, simply merge a PR into the `master` branch.

### Production

To deploy to production:

1. [Create a new GitHub release](https://github.com/bluedotimpact/bluedot/releases/new)
2. Click "Choose a tag" and enter a new tag in the format `website/vX.Y.Z` (e.g., `website/v1.2.3`)
3. Select "Previous tag" and choose the previous release tag (e.g., `website/v1.2.2`)
4. Click "Generate release notes", and review the notes
5. Click "Publish release"

The production release workflow is defined in [.github/workflows/website_deploy_production.yaml](../../.github/workflows/website_deploy_production.yaml).

*Note: Please use [SemVer](https://semver.org/) for version numbering.*

## Fonts

The website uses **Inter** for body text and **Inter Display** for headlines, while other apps in the monorepo continue to use the shared UI library fonts (Roobert and Reckless Neue).

### Implementation Details

- Font files are loaded via `next/font/local` from `/public/fonts/`
- CSS variable overrides in `globals.css` remap the shared UI library font variables

### ⚠️ Important: Font Files Must Be Preserved

**Do not delete any font files from `/public/fonts/`** - here's why:

- The shared UI library (`/libraries/ui/`) defines font URLs pointing to `https://bluedot.org/fonts/*`
- 8+ other apps (Storybook, Meet, Room, Editor, etc.) load Roobert/Reckless fonts from these URLs
- Deleting these fonts would break typography in all other apps
- The website overrides fonts locally while serving them for other apps

### Font Inventory

**Legacy fonts (used by other apps via HTTPS):**
- `Roobert-*.woff2` - Sans-serif (weights: 300, 400, 600, 700)
- `RecklessNeue-*.woff2` - Serif (weights: 300, 300i, 700)

These are loaded by the shared UI library (`libraries/ui/src/default-config/tailwind.css`) and consumed by the other apps in this monorepo:

- `storybook` — component documentation
- `meet` — meeting attendance + Zoom Web SDK
- `room` — meeting/collaboration app
- `editor` — content editor
- `availability` — scheduling/availability forms
- `course-demos` — interactive course demos
- `frontend-example` — example app
- `app-template` — template for new apps

**Website-specific fonts (loaded via next/font):**
- `Inter-*.woff2` - Body text (weights: 400, 500, 600, 700)
- `InterDisplay-*.woff2` - Headlines (weights: 400, 500, 600, 700)
- `Inter-OFL.txt` - SIL Open Font License for Inter fonts

For complete font licensing information, see `/public/fonts/README.md`

## Need Help?

- Ask in the #website-dev Slack channel
- Review the [Next.js documentation](https://nextjs.org/docs)
- Review the [Vitest documentation](https://vitest.dev/guide/)
- Review the [Tailwind CSS documentation](https://tailwindcss.com/docs)

