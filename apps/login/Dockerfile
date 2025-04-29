FROM quay.io/keycloak/keycloak:26.2@sha256:9869b88191392727f0be7301e53573cc39c13c9d9b9b08492c97d1ea40366eae AS base

### Build
FROM base AS builder
WORKDIR /opt/keycloak
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_FEATURES=admin-api,admin:v2,authorization,impersonation
ENV KC_FEATURES_DISABLED=account-api,account,ciba,client-policies,device-flow,kerberos,par,step-up-authentication,web-authn
ADD --chown=keycloak:keycloak --chmod=644 ./dist/bluedot-keycloak-theme.jar /opt/keycloak/providers/
RUN touch -m --date=@1743465600 /opt/keycloak/providers/*
RUN /opt/keycloak/bin/kc.sh build

### Final image
FROM base
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Set up for being behind a reverse proxy (e.g. ingress-nginx)
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_HOSTNAME_STRICT=false

# For local development:
# Install postgres on macOS with: brew install postgresql@17
# Then run: psql -U postgres -c 'create database "bluedot-login";'
# Uncomment these lines:
# ENV KC_DB_URL=jdbc:postgresql://host.docker.internal:5432/bluedot-login?user=postgres&password=postgres
# ENV KC_BOOTSTRAP_ADMIN_USERNAME=admin
# ENV KC_BOOTSTRAP_ADMIN_PASSWORD=admin

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD [ "start", "--optimized" ]
