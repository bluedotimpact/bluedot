<!-- omit from toc -->
# bluedot

This monorepo contains code for most of [BlueDot Impact](https://bluedot.org/)'s custom software. [Reading this README carefully can save you a lot of time](https://twitter.com/jcsrb/status/1392459191353286656).

<!-- omit from toc -->
## Table of contents

- [What's included](#whats-included)
- [Get started](#get-started)
- [Developer setup instructions](#developer-setup-instructions)
  - [Background knowledge to contribute](#background-knowledge-to-contribute)
  - [Development Handbook](./DEVELOPMENT_HANDBOOK.md)
  - [\[15 mins\] One-off setup](#15-mins-one-off-setup)
  - [Making contributions](#making-contributions)
- [Guide: Adding a new app](#guide-adding-a-new-app)
- [Reference: General package structure](#reference-general-package-structure)
- [Instructions for LLMs](#instructions-for-llms)

## What's included

This repository has the code for:

- [availability](./apps/availability/): Collect time availability information from users
- [course-demos](./apps/course-demos/): Interactive demos to be embedded on our courses
- [meet](./apps/meet/): Record meeting attendance, and host meetings with the Zoom Web SDK
- [login](./apps/login/): A custom build of Keycloak
- [posthog-proxy](./apps/posthog-proxy/) (analytics.k8s.bluedot.org): Reverse proxy to send analytics to PostHog
- [storybook](./apps/storybook/) (storybook.k8s.bluedot.org): App to demo and document design system components
- [website](./apps/website/) (bluedot.org): Public website
- [website-proxy](./apps/website-proxy/) (bluedot.org): Reverse proxy to split traffic between the new and old website during migration
- [infra](./apps/infra/): Deploying the above applications on Kubernetes

The following key parts of our software are _not_ in this repository because they are built in 3rd party services that are hard to open-source the code for:

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

In-progress work is tracked in the [BlueDot design/engineering kanban](https://github.com/orgs/bluedotimpact/projects/6).

If you run into any difficulties, raise an issue or [contact us](mailto:team@bluedot.org).

<details>
<summary>What if I want to use BlueDot Impact's software myself?</summary>
You're very welcome to use and adapt our software for your own purposes, subject to <a href="./LICENSE">the repository license</a>. In general most of our apps are packaged as Docker containers, and most of our libraries are TypeScript NPM packages.

There isn't yet extensive documentation on using our software for your own purposes. We'd be happy to accept contributions that make it easier for others to use our software. This could be by improving the way apps are structured or adding documentation.
</details>

<details>
<summary>How will my contribution be handled?</summary>
Our general principle for reviewing contributions is 'does this make things better' rather than 'is this perfect'. We'll generally try to give you feedback, but given our limited resources we sometimes may not always be able to do this.

When contributing, you agree that we can use your contribution how we see fit, and you relinquish any copyright, patent, moral or other intellectual property rights in your contribution.
</details>

## Developer setup instructions

### Background knowledge to contribute

We recommend most contributors learn how to:

- Use [Visual Studio Code](https://www.youtube.com/watch?v=KMxo3T_MTvY) (recommended), or another code editor
- [Contribute code on GitHub](https://github.com/firstcontributions/first-contributions?tab=readme-ov-file)
- [Read and write TypeScript code](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [Use the basics of NPM and Node.js](https://careerfoundry.com/en/blog/web-development/what-is-npm/)

For detailed development patterns, standards, and best practices, see our [Development Handbook](./DEVELOPMENT_HANDBOOK.md).

### [15 mins] One-off setup

Follow the instructions for your operating system:

<details>
<summary>macOS</summary>

[Open the Terminal app](https://www.youtube.com/watch?v=i21v35DqAYs). Then paste in the following code and follow the on-screen instructions to set everything up:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo >> ~/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

brew install git gh docker colima
brew install --cask visual-studio-code
colima start --memory 8
brew services restart colima
docker context use colima
open https://github.com/login/device
echo y | gh auth login --git-protocol https --hostname github.com --web --scopes user

if [ -z "$(git config --global user.name)" ]; then
  user=$(gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /user | jq -r .login)
  git config --global user.name "$user"
fi
if [ -z "$(git config --global user.email)" ]; then
  email=$(gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /user/emails | jq -r '.[] | select(.visibility == "public") | .email')
  git config --global user.email "$email"
fi

open 'vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https%3A%2F%2Fgithub.com%2Fbluedotimpact%2Fbluedot.git'
```
Once VS Code opens, accept the pop-ups that appear. It might look like nothing is happening for a couple of minutes, and it'll take about 5 minutes for everything to open properly. You'll know it's done once you see the message `Congrats! Your setup is complete` on your screen.

**Troubleshooting**
- I got asked for permissions / got some permissions warning and didn't click allow in time, and then the script failed.
  - Click 'allow' on any remaining popups or notifications
  - Close and reopen Terminal (click okay to warnings), and paste in the script again
- GitHub opened and is asking for a code, where do I get this?
  - It should be on the second to last line in the Terminal

</details>

<details>
<summary>Debian-based linux (including Ubuntu)</summary>

Run the following in your terminal:

```bash
sudo apt update
sudo apt install -y git-all gh

if ! command -v docker &> /dev/null; then
  sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt install -y docker-ce
  sudo usermod -aG docker ${USER}
fi

xdg-open https://github.com/login/device
echo y | gh auth login --git-protocol https --hostname github.com --web --scopes user

if [ -z "$(git config --global user.name)" ]; then
  user=$(gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /user | jq -r .login)
  git config --global user.name "$user"
fi
if [ -z "$(git config --global user.email)" ]; then
  email=$(gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /user/emails | jq -r '.[] | select(.visibility == "public") | .email')
  git config --global user.email "$email"
fi

xdg-open 'vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https%3A%2F%2Fgithub.com%2Fbluedotimpact%2Fbluedot.git'
```
Once VS Code opens, accept the pop-ups that appear. It might look like nothing is happening for a couple of minutes, and it'll take about 5 minutes for everything to open properly. You'll know it's done once you see the message `Congrats! Your setup is complete` on your screen.

</details>

<details>
<summary>Windows</summary>

Install the following software:

1. [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
2. [Visual Studio Code](https://code.visualstudio.com/)
3. [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
4. Open a terminal and type `wsl`
5. Make sure you're on the Linux file system (e.g., `john@johns-box:~$`), and not a mounted Windows drive. If on a mounted drive, type `cd ~`
6. Install [Docker Engine](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)
7. Install Git with `sudo apt-get install git`

Then:

1. Open VS Code
2. Open the Command Palette (`View` > `Command Palette...`, or CTRL+SHIFT+P) and select `>WSL: Connect to WSL`.
3. Once connected, open a Terminal Pane (`View` > `Terminal`, or CTRL+~)
4. Make sure you're on the Linux file system (e.g., `john@johns-box:~$`), and not a mounted Windows drive. If on a mounted drive, type `cd ~`
5. Type `git clone https://github.com/bluedotimpact/bluedot.git`
6. Select `File` > `Open Folder` and choose the newly created bluedot directory:
   `/home/john/bluedot/`
7. You will see a message that a Dev Container configuration was detected. Select `Reopen in Container`

VS Code will download the Docker images and build the dev container. This will take a few minutes. At the end you will see `Congrats! Your setup is complete`.

</details>

If the above instructions don't get you set up properly, [raise an issue on the repository](https://github.com/bluedotimpact/bluedot/issues/new).

### Making contributions

Find the [app](./apps/) or [library](./libraries/) you want to contribute to. It should follow the [general package structure](#reference-general-package-structure). Usually this means you put any necessary values in `.env.local` (if present), and edit code in `src`.

To run the app, from the app's folder (e.g. `cd apps/app-template` - if you're not familiar with this command, see [this video](https://www.youtube.com/watch?v=id3DGvljhT4)) use the command:
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

If there are changes to the dev container setup or you mess up your configuration, open the VS Code Command Palette and run `Dev Containers: Rebuild Container`. If it's still not working, delete the bluedot folder on your computer (warning: you will lose any changes you haven't pushed to GitHub!) and go through the setup steps from scratch.

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
  - `npm run deploy:cd`: Actually deploy the app, usually into the production (real-world) environment. You usually don't need to run this manually, as it is run by CD tooling when you merge your changes into the master branch. An exception is the [website](./apps/website/) app, which is deployed manually to production, see [its README](./apps/website/README.md) for more details.
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
- Databases: Unified database abstraction via [@bluedot/db](./libraries/db/) package, which provides an interface to unified Airtable+Postgres operations using [airtable-ts](https://github.com/domdomegg/airtable-ts) and [Drizzle ORM](https://orm.drizzle.team/), plus some custom syncing logic (run in `pg-sync-service`).
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
- Multistage deployments (for [website](./apps/website/README.md)): [docker-scripts](./libraries/docker-scripts/README.md) & [.github/workflows/website_deploy_production.yaml](./.github/workflows/website_deploy_production.yaml)
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
