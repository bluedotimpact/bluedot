package org.bluedotimpact.keycloak;

import org.keycloak.Config;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventListenerProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

public class RevokePasswordOnIdpLinkEventListenerFactory implements EventListenerProviderFactory {

    public static final String PROVIDER_ID = "bluedot-revoke-password-on-idp-link";

    @Override
    public EventListenerProvider create(KeycloakSession session) {
        return new RevokePasswordOnIdpLinkEventListener(session);
    }

    @Override
    public void init(Config.Scope config) {
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
    }

    @Override
    public void close() {
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }
}
