FROM node:20-alpine as base

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