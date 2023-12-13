FROM nginx:stable-alpine-slim

COPY src/iframe.html /usr/share/nginx/html/iframe.html
COPY src/nginx.template.conf /etc/nginx/nginx.template.conf
ARG VERSION_TAG
RUN envsubst '$VERSION_TAG' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf
RUN nginx -t

EXPOSE 80
