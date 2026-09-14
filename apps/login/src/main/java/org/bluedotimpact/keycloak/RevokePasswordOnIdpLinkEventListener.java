package org.bluedotimpact.keycloak;

import java.util.List;

import org.jboss.logging.Logger;
import org.keycloak.credential.CredentialModel;
import org.keycloak.events.Details;
import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.SubjectCredentialManager;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;

/**
 * Deletes an account's password credentials when a brokered identity (Google) is linked to it,
 * since signup does not verify emails and the password may have been set by someone else.
 */
public class RevokePasswordOnIdpLinkEventListener implements EventListenerProvider {

    private static final Logger logger = Logger.getLogger(RevokePasswordOnIdpLinkEventListener.class);

    private final KeycloakSession session;

    public RevokePasswordOnIdpLinkEventListener(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public void onEvent(Event event) {
        if (event.getType() != EventType.FEDERATED_IDENTITY_LINK) {
            return;
        }

        RealmModel realm = session.realms().getRealm(event.getRealmId());
        UserModel user = session.users().getUserById(realm, event.getUserId());
        SubjectCredentialManager credentials = user.credentialManager();

        List<CredentialModel> passwords = credentials
                .getStoredCredentialsByTypeStream(PasswordCredentialModel.TYPE)
                .toList();
        for (CredentialModel password : passwords) {
            credentials.removeStoredCredentialById(password.getId());
        }
        // Logged even when the count is 0 so prod logs distinguish "ran, nothing to revoke" from "never ran"
        logger.infof("Revoked %d password credential(s) of user %s after linking identity provider '%s'",
                passwords.size(), user.getId(), event.getDetails().get(Details.IDENTITY_PROVIDER));
    }

    @Override
    public void onEvent(AdminEvent event, boolean includeRepresentation) {
    }

    @Override
    public void close() {
    }
}
