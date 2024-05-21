FROM quay.io/keycloak/keycloak:24.0.4 as base

### Build
FROM base as builder
WORKDIR /opt/keycloak
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_FEATURES=admin-api,admin2,authorization,impersonation
# This should be everything not the above, and we want to replace this with 'default'
# See https://github.com/keycloak/keycloak/issues/29761
ENV KC_FEATURES_DISABLED=account-api,account3,ciba,client-policies,device-flow,js-adapter,kerberos,par,step-up-authentication,web-authn
COPY ./dist/bluedot-keycloak-theme.jar /opt/keycloak/providers
RUN /opt/keycloak/bin/kc.sh build

### Final image
FROM base
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Set up for being behind a reverse proxy (e.g. ingress-nginx)
ENV KC_PROXY=edge
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_HOSTNAME_STRICT=false

# Set admin username (nb: password set as runtime env var in infra)
ENV KEYCLOAK_ADMIN=software@bluedot.org

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD [ "start", "--optimized" ]
