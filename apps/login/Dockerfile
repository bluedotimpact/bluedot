FROM quay.io/keycloak/keycloak:26.2@sha256:9869b88191392727f0be7301e53573cc39c13c9d9b9b08492c97d1ea40366eae AS base

### Compile custom providers against the jars shipped in the Keycloak image
# (the Keycloak image has no javac, hence the separate JDK stage)
FROM eclipse-temurin:21-jdk@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b AS providers-builder
COPY --from=base /opt/keycloak/lib/lib/main /kc-lib/main
COPY --from=base /opt/keycloak/lib/lib/boot /kc-lib/boot
COPY ./src /build/src
RUN mkdir -p /build/classes \
    && javac --release 21 -cp "/kc-lib/main/*:/kc-lib/boot/*" -d /build/classes $(find /build/src/main/java -name '*.java') \
    && cp -r /build/src/main/resources/. /build/classes/ \
    && jar --create --file /build/bluedot-keycloak-providers.jar --date 2025-04-01T00:00:00Z -C /build/classes .

### Build
FROM base AS builder
COPY --from=providers-builder --chown=keycloak:keycloak --chmod=644 /build/bluedot-keycloak-providers.jar /opt/keycloak/providers/
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
