FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2 AS base

RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY dist_tools/json/package.json ./
COPY dist_tools/json/package-lock.json ./

RUN --mount=type=cache,target=/app/.npm \
  npm set cache /app/.npm && \
  npm ci --omit=dev --audit false --fund false

USER node

COPY --chown=node:node ./dist/ .

EXPOSE 8080

CMD PORT="8080" dumb-init node index.js
