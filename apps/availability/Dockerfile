FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS base

RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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
