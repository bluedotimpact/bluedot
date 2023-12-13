FROM node:20-alpine as base

RUN apk update && apk add --no-cache dumb-init

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY package.json ./
COPY dist_tools/package-lock.json ./

RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm ci --omit=dev --audit false --fund false

USER node

COPY --chown=node:node ./dist/ .

EXPOSE 8001

CMD ["dumb-init", "node", "index.js"]