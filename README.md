<!-- omit from toc -->
# bluedot

This monorepo contains code for most of [BlueDot Impact](https://bluedot.org/)'s custom software. [Reading this README carefully can save you a lot of time](https://twitter.com/jcsrb/status/1392459191353286656).

<!-- omit from toc -->
## Table of contents

- [What's included](#whats-included)
- [Get started](#get-started)
- [Background knowledge to contribute](#background-knowledge-to-contribute)
- [Developer setup instructions](#developer-setup-instructions)
- [Guide: Adding a new app](#guide-adding-a-new-app)
- [Reference: General package structure](#reference-general-package-structure)
- [Instructions for LLMs](#instructions-for-llms)

## What's included

This repository has the code for:

- [availability](./apps/availability/): Collect time availability information from users
- [course-demos](./apps/course-demos/): Interactive demos to be embedded on our courses
- [meet](./apps/meet/): Record meeting attendance, and host meetings with the Zoom Web SDK
- [login](./apps/login/): A custom build of Keycloak
- [login-account-proxy](./apps/login-account-proxy/): An app for setting up users in Keycloak from Bubble
- [miniextensions-proxy](./apps/miniextensions-proxy/) (forms.bluedot.org): Host forms on a custom domain
- [posthog-proxy](./apps/posthog-proxy/) (analytics.k8s.bluedot.org): Reverse proxy to send analytics to PostHog
- [storybook](./apps/storybook/) (storybook.k8s.bluedot.org): App to demo and document design system components
- [website-25](./apps/website-25/) (website-25-production.k8s.bluedot.org): New public website for 2025
- [website-proxy](./apps/website-proxy/) (bluedot.org): Reverse proxy to split traffic between the new and old website during migration
- [infra](./apps/infra/): Deploying the above applications on Kubernetes

The following key parts of our software are _not_ in this repository because they are built in 3rd party services that are hard to open-source the code for:

- Other public websites (parts of [bluedot.org](https://bluedot.org/), [aisafetyfundamentals.com](https://aisafetyfundamentals.com/), [biosecurityfundamentals.com](https://biosecurityfundamentals.com/) etc.): Wordpress
- Course hub: [Bubble](https://bubble.io/)
- Application forms: [MiniExtensions](https://miniextensions.com/)
- Application form short links: [Short.io](https://short.io/)
- Primary database: [Airtable](https://www.airtable.com/)

The following key parts of our software are _not_ in this repository because they use substantially different toolchains, and are a pain to set up in a monorepo:

- Various Airtable extensions
  - [AI evaluator](https://github.com/bluedotimpact/ai-evaluator-extension)
  - [Cohort scheduling](https://github.com/bluedotimpact/cohort-scheduling-extension)
- [Keycloak theme](https://github.com/bluedotimpact/bluedot-keycloak-theme)
- [Airtable standards](https://github.com/bluedotimpact/airtable-standards)

## Get started

We welcome contributions! To help improve BlueDot Impact's software:

**For simple edits** e.g. typos or editing documentation, you should be able to search for the text in this repository and [make edits in the GitHub UI](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files).

**For more complex edits**, check you have the [core skills to contribute](#background-knowledge-to-contribute), then follow the [developer setup instructions](#developer-setup-instructions) below.

If you run into any difficulties, raise an issue or [contact us](https://bluedot.org/contact/).

<details>
<summary>What if I want to use BlueDot Impact's software myself?</summary>
You're very welcome to use and adapt our software for your own purposes, subject to <a href="./LICENSE">the repository license</a>. In general most of our apps are packaged as Docker containers, and most of our libraries are TypeScript NPM packages.

There isn't yet extensive documentation on using our software for your own purposes. We'd be happy would accept contributions that make it easier for others to use our software. This could be by improving the way apps are structured or adding documentation.
</details>

<details>
<summary>How will my contribution be handled?</summary>
Our general principle for reviewing contributions is 'does this make things better' rather than 'is this perfect'. We'll generally try to give you feedback, but given our limited resources we sometimes may not always be able to do this.

When contributing, you agree that we can use your contribution how we see fit, and you relinquish any copyright, patent, moral or other intellectual property rights in your contribution.
</details>

## Background knowledge to contribute

We recommend most contributors learn how to:

- Navigate their [terminal](https://www.youtube.com/watch?v=lZ7Kix9bjPI) and [shell](https://www.youtube.com/watch?v=fhv2dX0axeY)
- [Contribute code on GitHub](https://github.com/firstcontributions/first-contributions?tab=readme-ov-file)
- [Read and write TypeScript code](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [Use the basics of NPM and Node.js](https://careerfoundry.com/en/blog/web-development/what-is-npm/)

## Developer setup instructions

1. (recommended, macOS only) Install [Homebrew](https://brew.sh/)
2. Install [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
   - On macOS with Homebrew:
      ```
      brew install git
      ```
   - On Ubuntu Linux:
      ```
      sudo apt install -y git-all
      ```
3. Install [Node.js 22](https://nodejs.org/)
   - On macOS with Homebrew:
      ```
      brew install node
      ```
   - On Ubuntu Linux: 
      ```
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
      ```
4. Install [Docker client](https://docs.docker.com/engine/install/). NB: NOT Docker Desktop.
   - On macOS with Homebrew:
      ```
      brew install docker
      ```
   - On Ubuntu Linux: [instructions](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-22-04)
5. Install and configure a container runtime.
   - On macOS with Homebrew:
      ```
      brew install colima && brew services start colima && docker context use colima
      ```
   - On Ubuntu Linux: already installed with client
   - Other platforms: [Docker Engine](https://docs.docker.com/engine/install/) (NB: NOT Docker Desktop)
6. Install kubectl.
   - On macOS with Homebrew:
      ```
      brew install kubectl
      ```
   - On Ubuntu Linux: [instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/#install-using-native-package-management)
7. (recommended) Install [Visual Studio Code](https://code.visualstudio.com/)
   - On macOS with Homebrew:
      ```
      brew install --cask visual-studio-code
      ```
8. [Clone this repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
   - To clone the main repo (you might want your fork instead):
      ```
      git clone git@github.com:bluedotimpact/bluedot.git
      ```
9.  Change directory into the cloned repository, and install dependencies with: 
      ```
      npm install
      ```

Then find the [app](./apps/) or [library](./libraries/) you want to contribute to. It should follow the [general package structure](#reference-general-package-structure). Usually this means you can change directory into the relevant folder, put any necessary values in `.env.local` (if present), edit code in `src`, and run
```
npm run start
```
or
```
npm run test
```

Some packages have their own README with further developer setup instructions specific to that app, plus useful information about how the app works. Read this!

Over time other people will make changes to the repository. Usually to get up to date with those changes, you'll need to [pull the latest changes from the master branch](https://docs.github.com/en/get-started/using-git/getting-changes-from-a-remote-repository), then re-run 
```
npm install
```

## Guide: Adding a new app

The above should be enough to edit existing applications. To create a new Next.js app (which is _usually_ what you'll want):

1. Copy the [`app-template`](./apps/app-template/) folder.
2. Rename the copied folder, and the name of the app in its `package.json`, then run `npm install`
3. Add the app to infra's [serviceDefinitions.ts](./apps/infra/src/k8s/serviceDefinitions.ts)
   - Copy the config for app-template, but put your app name in
   - You can remove secrets your app doesn't need (e.g. if it doesn't need to talk to Airtable or Slack)
   - If you need to add a secret, see [infra's README](./apps/infra/README.md#adding-a-secret)
4. Commit your changes to the master branch

CI/CD might fail the first time. If so, just [re-run the failed jobs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/re-running-workflows-and-jobs#re-running-failed-jobs-in-a-workflow). This happens because there's a race condition between:
- the infra being set up and expecting a docker container to pull
- the docker deploy script wanting infra to deploy to

## Reference: General package structure

This repository is split up into _packages_ in the folders:
- `libraries`: code that is reused or shared across applications
- `apps`: final products that actually get deployed, usually as web services

For example, the [shared UI code for common components](./libraries/ui/) like buttons is a library. This would be consumed by multiple apps, such as the time availability form.

Inside each package folder, the common files you'll find are:
- (always) `package.json`: defines the NPM scripts, dependencies, and sometimes other package configuration. The `package.json` should usually identify the entrypoint (for libraries) or have at least a start script (for apps). Common scripts include:
  - `npm run start`: Start the application locally. The port should usually be printed to the terminal, and then you can visit `localhost:<port>` in your browser e.g. [`localhost:8000`](http://localhost:8000/).
  - `npm run test`: Run automated tests, usually defined the files ending in `.test.ts` or `.test.tsx`. Most packages use vitest - see the [vitest CLI docs for help](https://vitest.dev/guide/cli).
  - `npm run test:watch`: Run the automated tests in an interactive watch mode. This runs the relevant tests automatically each time you edit the code.
  - `npm run lint`: Check for lint issues. Visual Studio Code should usually highlight these for you already.
  - `npm run build`: Build the application. This usually finds any type errors, which Visual Studio Code should usually highlight for you already.
  - `npm run postinstall`: Perform any extra steps to setup the application for development. Usually things like creating configuration files for local development. You usually don't need to run this manually, as it runs when you run `npm install`.
  - `npm run deploy:cd`: Actually deploy the app, usually into the production (real-world) environment. You usually don't need to run this manually, as it is run by CD tooling when you merge your changes into the master branch. An exception is the [website-25](./apps/website-25/) app, which is deployed manually to production, see [its README](./apps/website-25/README.md) for more details.
- `README.md`: documentation to explain what the package does, how to use it, and how to contribute
- `src`: most of the code usually lives here. You usually want to edit files in this folder.
  - `pages`: pages in the web app. For example `pages/some-page.tsx` usually corresponds to `app.bluedot.org/some-page`. The `api` folder contains API routes rather than webpages ([learn more in the Next.js docs](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)).
  - `components`: components reused within the web app. If the component is likely to be useful for multiple applications, consider moving it to the `ui` package.
  - `lib`: helper scripts for use around the application, that aren't components
  - `index.ts`: usually the entrypoint, i.e. what runs when starting or deploying an app, or the what is imported when importing a library.
  - `public`: static files for web hosting directly, usually fonts or images 
- `.env.*`: environment files, usually to set secrets or configuration.
  - `.env.local`: for local development, e.g. when running `npm run start`. This isn't synced to git, so you can put real secrets in here. If you have issues with your environment, try deleting this file and running `npm install` again (maybe save the values first if they're important secrets!) - this should usually replace it with the template file.
  - `.env.local.template`: intended to help people create their own `.env.local` file. This is synced to git, so you should only put example or non-secret values here.
  - `.env.test`: for the test environment, e.g. when running `npm run test`.
- `tools`: custom tools helpful for developing the app, often referred to by NPM scripts.
- `Dockerfile`: (apps only) code to help transform the package into a Docker container to be easily deployed.
- `dist`, `.turbo`: built or transformed outputs are put here. You can usually ignore this folder.
- `node_modules`: any special dependencies for this specific package, that can't be put at the workspace root usually because of clashing versions. You can usually ignore this folder.

In terms of tools and external libraries, we usually use:
- Coding language: [TypeScript](https://www.typescriptlang.org/)
- Script management: [NPM](https://docs.npmjs.com/cli/v10/using-npm/scripts)
- Custom dev tooling: Node.js or Bash (in the `tools` folder)
- Databases: Usually Airtable (via [airtable-ts](https://www.npmjs.com/package/airtable-ts)). Sometimes Postgres (via [kysely](https://www.npmjs.com/package/kysely) and [kanel](https://www.npmjs.com/package/kanel)).
- APIs: JSON via REST. Use path parameters and request bodies to send information. Web services should respond with an X-BlueDot-Version header in the format `yyyyMMdd.hhmmss.git_short_hash` (via environment variable `VERSION_TAG`).
- Authentication: JSON web tokens (JWTs), with sign-in via Open ID Connect (OIDC)
- Linting tool: [eslint](https://eslint.org/)
- Testing framework: [vitest](https://vitest.dev/)
- Web applications
  - Front-end library: [React.js](https://react.dev/)
  - Framework: [Next.js](https://nextjs.org/), with the pages router and usually without SSR
  - Styling: [Tailwind CSS](https://tailwindcss.com/)
  - Components: Our own [ui](./libraries/ui/) or [@adobe/react-spectrum](https://react-spectrum.adobe.com/react-spectrum/#components)
  - `className` util: [clsx](https://www.npmjs.com/package/clsx)
  - Global state store: [zustand](https://github.com/pmndrs/zustand)
- Schema validation: [zod](https://zod.dev/)
- Infrastructure management: [Pulumi](https://www.pulumi.com/)
- Reverse proxies: [nginx](https://nginx.org/)
- CI and CD: GitHub Actions via [.github](./.github/workflows/ci_cd.yaml)
- Multistage deployments (for [website-25](./apps/website-25/README.md)): [docker-scripts](./libraries/docker-scripts/README.md) & [.github/workflows/website_deploy_production.yaml](./.github/workflows/website_deploy_production.yaml)
- Deployment: Docker on K8s via [infra](./apps/infra/)

In general, we try to keep to the above structure and tools as much as possible between packages. This reduces the mental effort required to switch between working on different packages, and eases maintenance burden. We're fans of [boring technology](https://boringtechnology.club/).

## Instructions for LLMs

After reading this README file, you should read all the other READMEs in this repository. If you can't find them, run this bash command to read them all:

```bash
git ls-files --cached --others --exclude-standard | grep -i 'README' | grep -v '^README.md$' | while read file; do
    echo "\n===== $file =====\n"
    cat "$file"
done
```
