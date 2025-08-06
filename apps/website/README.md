# BlueDot Website

Quick links:
- [Production version](https://bluedot.org/)
- [Staging version](https://website.k8s.bluedot.org/)
- [Storybook](https://bluedot-storybook.k8s.bluedot.org/)
- [Designs](https://www.figma.com/design/s4dNR4ELGKPbja6GkHLVJy/Website-Laura's-Working-File)

## Tech Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Testing**: Vitest (Jest) + React Testing Library
- **Component Development**: Storybook
- **Deployment**: Kubernetes (via GitHub Actions)

## Fonts

The website uses **Inter** for body text and **Inter Display** for headlines, while other apps in the monorepo continue to use the shared UI library fonts (Roobert and Reckless Neue).

### Implementation Details

- Font files are loaded via `next/font/local` from `/public/fonts/`
- CSS variable overrides in `globals.css` remap the shared UI library font variables
- See the [font migration plan](./font-migration-plan.md) for full implementation details

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

**Website-specific fonts (loaded via next/font):**
- `Inter-*.woff2` - Body text (weights: 400, 500, 600, 700)
- `InterDisplay-*.woff2` - Headlines (weights: 400, 500, 600, 700)

## Project Structure

```
apps/website/
├── src/
│   ├── components/     # Reusable UI components
│   ├── lib/
│   │   ├── /api        # API routes
│   │   ├── /utils      # Helper functions and utils
│   ├── pages/          # Next.js pages
│   ├── globals.css     # Custom Tailwind CSS styles
├── public/             # Static assets
```

## Developer Setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions).

```bash
npm run start
```

```bash
npm run test
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

1. Add the API route in `src/lib/api/`
2. Update `src/lib/api/db/tables.ts` if needed

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

## Need Help?

- Ask in the #website-dev Slack channel
- Review the [Next.js documentation](https://nextjs.org/docs)
- Review the [Vitest documentation](https://vitest.dev/guide/)
- Review the [Tailwind CSS documentation](https://tailwindcss.com/docs)