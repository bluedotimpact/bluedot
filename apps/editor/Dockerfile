# You usually shouldn't need to edit this file.
# If you came here to change environment variables:
# - Add server-side env vars to infra's serviceDefinitions.ts
# - Add client-side env vars to .env.production (you might need to create this)
# If you came here to change the build process, edit the `npm run build` script in package.json instead

FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2 AS base

RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Set the correct permission for prerender cache
RUN mkdir dist
RUN chown node:node dist

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY --chown=node:node dist/standalone ./
COPY --chown=node:node public ./apps/${APP_NAME}/public
COPY --chown=node:node dist/static ./apps/${APP_NAME}/dist/static

USER node

EXPOSE 8080

CMD HOSTNAME="0.0.0.0" PORT="8080" dumb-init node ./apps/${APP_NAME}/server.js
