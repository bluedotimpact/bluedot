import * as gcp from "@pulumi/gcp";
import { cloudSqlPassword, cloudSqlTier, gcloudZone } from "../config";

// Create the database instance
export const databaseInstance = new gcp.sql.DatabaseInstance("database", {
    databaseVersion: 'POSTGRES_15',
    settings: {
        locationPreference: {
            zone: gcloudZone,
        },
        tier: cloudSqlTier,
        // Enable connections from the public internet
        // In future we might want to lock this down more, or require certificate auth
        ipConfiguration: {
            authorizedNetworks: [{
                value: '0.0.0.0/0'
            }],
            // Given we're connecting over the internet, always require encryption in transit
            sslMode: 'ENCRYPTED_ONLY'
        }
    },
});

// Set the default user password
export const postgresUser = new gcp.sql.User("postgres-user", {
    instance: databaseInstance.id,
    name: 'postgres',
    password: cloudSqlPassword,
})

// Database for Mathesar's internal metadata
new gcp.sql.Database("mathesar_django", {
    instance: databaseInstance.id,
    name: 'mathesar_django',
})
