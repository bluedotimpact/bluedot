# docker-scripts

Scripts for making running and deploying docker containers easy.

## Setup

1. Install the `@bluedot/docker-scripts` dependency in your package.json
2. Add the following scripts in package.json:
   ```
   "start": "docker-scripts start",
   "deploy:cd": "docker-scripts deploy",
   ```
   (if there's already a start script, use `start:docker` instead)
3. Create a `Dockerfile` next to your app root that exposes port 8080 as the main web service

You might also want to see the instructions in [infra](../../apps/infra/README.md) for adding a new service. Or see an existing app for an example.

## Usage

`docker-scripts start`: This will run your docker container. You can then access the web service at [localhost:8000](http://localhost:8000).

`docker-scripts deploy`: This will deploy your app to production, however it's configured in [`infra`](../../apps/infra/). Specifically, it'll build your app and container, tag and push it to Vultr container registry, and bounce the k8s deployment.

### Multistage Deployments

`website-25` has a multistage deployment, which means it has a staging and a production environment.

To deploy to staging, use `docker-scripts multistage-deploy-staging`.
To deploy to production, use `docker-scripts multistage-deploy-production`.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)
