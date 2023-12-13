# bluedot

https://www.notion.so/bluedot-impact/Core-database-custom-platform-MVP-b3f8440f34dc424d9a86deccb0d39a3e

## Developer setup

These instructions are for macOS, but roughly may help you get set up on other platforms.

1. Install [brew](https://brew.sh/): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Install Node 21: `brew install node@21`
3. Install Postgres 15: `brew install postgres@15`
4. Install Visual Studio Code: `brew install --cask visual-studio-code`
5. Install docker: `brew install docker`
6. Install colima: `brew install colima && docker context use colima`
7. Install kubectl: `brew install kubernetes-cli`
8. Install Google Cloud SDK: `brew install --cask google-cloud-sdk`
9. Get added to the bluedot-prod GCP project and configure Google Cloud SDK: `gcloud auth login && gcloud config set project bluedot-prod && gcloud auth application-default login && gcloud auth configure-docker europe-west1-docker.pkg.dev --quiet && gcloud components install gke-gcloud-auth-plugin --quiet`
10. Install NPM dependencies: `npm install`
11. Start things, e.g. `npm start -- --filter backend`
