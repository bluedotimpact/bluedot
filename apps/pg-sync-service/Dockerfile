# TODO Get docker version working, and re-add `"start:docker": "docker-scripts start",` to package.json

FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2 AS base

RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV production

COPY package.json ./
COPY dist_tools/package-lock.json ./

RUN --mount=type=cache,target=/app/.npm \
  npm set cache /app/.npm && \
  npm ci --omit=dev --audit false --fund false

USER node

COPY --chown=node:node ./dist/ .

EXPOSE 8080

CMD dumb-init PORT=8080 node index.js