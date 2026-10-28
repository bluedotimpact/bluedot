FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS base

RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Build tag (`YYYYMMDD.HHMMSS.<git-short-sha>`); read at runtime to stamp emitted PostHog events
ARG VERSION_TAG
ENV VERSION_TAG=${VERSION_TAG}

COPY package.json ./
COPY dist_tools/package-lock.json ./

RUN --mount=type=cache,target=/app/.npm \
  npm set cache /app/.npm && \
  npm ci --omit=dev --audit false --fund false

USER node

COPY --chown=node:node ./dist/ .

EXPOSE 8080

CMD PORT="8080" dumb-init node index.js
