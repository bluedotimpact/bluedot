FROM nginx:stable-alpine-slim

COPY dist /usr/share/nginx/html
COPY tools/nginx.template.conf /etc/nginx/nginx.template.conf
ARG VERSION_TAG
RUN envsubst '$VERSION_TAG' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf
RUN nginx -t

EXPOSE 80
