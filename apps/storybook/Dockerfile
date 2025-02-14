FROM nginx:stable-alpine-slim@sha256:6a3378d408c49073bdbb0243219db1072f338b979b58660577a744044515f9f7

COPY src/nginx.template.conf /etc/nginx/nginx.template.conf
COPY dist /usr/share/nginx/html

ARG VERSION_TAG
RUN envsubst '$VERSION_TAG' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf
RUN nginx -t

EXPOSE 8080
