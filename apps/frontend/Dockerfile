FROM node:lts-alpine@sha256:7e227295e96f5b00aa79555ae166f50610940d888fc2e321cf36304cbd17d7d6 AS base

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY --chown=node:node .next/standalone ./
COPY --chown=node:node public ./apps/${APP_NAME}/public
COPY --chown=node:node .next/static ./apps/${APP_NAME}/.next/static

USER node

EXPOSE 80

CMD HOSTNAME="0.0.0.0" PORT="80" node ./apps/${APP_NAME}/server.js
