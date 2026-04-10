import { jsonStringify } from '@pulumi/pulumi';
import { type core } from '@pulumi/kubernetes/types/input';
import { envVarSources } from './secrets';
import { getConnectionDetails, keycloakPg, airtableSyncPg } from './postgres';
import {
  minioPvc, mcpAggregatorDataPvc, mcpAshbyDataPvc, mcpGoogleDataPvc,
} from './pvc';
import { websiteAssetsBucket } from '../minio';
import { config } from '../config';

const ALERTS_SLACK_CHANNEL_ID = 'C04SAGM4FN1'; // #update_tech-prod
const INFO_SLACK_CHANNEL_ID = 'C04SFUECECU'; // #updates_tech-dev
const CLIENT_ERRORS_SLACK_CHANNEL_ID = 'C0AL75QQ0SC'; // #update_client-errors

const MCP_AGGREGATOR_HOST = 'mcp.k8s.bluedot.org';
const MCP_ASHBY_HOST = 'mcp-ashby.k8s.bluedot.org';
const MCP_GOOGLE_HOST = 'mcp-google.k8s.bluedot.org';
// Front-door auth for the MCP services uses Google OIDC. Access is restricted to @bluedot.org
// because the OAuth client (mcpGoogleOauthClientId) lives in a GCP project whose consent screen
// is configured as "Internal" — Google enforces that server-side.
const mcpGoogleOauth = {
  issuer: 'https://accounts.google.com',
  clientId: config.requireSecret('mcpGoogleOauthClientId'),
  clientSecret: config.requireSecret('mcpGoogleOauthClientSecret'),
  userClaim: 'email',
};

// Identity-only auth: just verifies the user is @bluedot.org. Used by services that don't need
// Google Workspace data access (e.g. Ashby MCP).
const mcpIdentityAuth = {
  ...mcpGoogleOauth,
  scopes: [
    'openid',
    'email',
    'profile',
  ],
};

// Workspace auth: identity + Google Workspace API scopes. Used by the MCP aggregator (which
// proxies to workspace-mcp). Scopes use the broadest variant per service; workspace-mcp's scope
// hierarchy handles mapping (e.g. gmail.modify implies gmail.readonly).
// See workspace-mcp auth/scopes.py SCOPE_HIERARCHY.
const mcpWorkspaceAuth = {
  ...mcpGoogleOauth,
  scopes: [
    // Identity
    'openid',
    'email',
    'profile',
    // Gmail (modify covers readonly/send/compose/labels)
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.settings.basic',
    // Drive (drive covers drive.readonly and drive.file)
    'https://www.googleapis.com/auth/drive',
    // Calendar (calendar covers calendar.readonly and calendar.events)
    'https://www.googleapis.com/auth/calendar',
    // Docs
    'https://www.googleapis.com/auth/documents',
    // Sheets
    'https://www.googleapis.com/auth/spreadsheets',
    // Slides
    'https://www.googleapis.com/auth/presentations',
    // Forms
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    // Tasks
    'https://www.googleapis.com/auth/tasks',
    // Contacts
    'https://www.googleapis.com/auth/contacts',
    // Apps Script
    'https://www.googleapis.com/auth/script.projects',
    'https://www.googleapis.com/auth/script.deployments',
    'https://www.googleapis.com/auth/script.processes',
    'https://www.googleapis.com/auth/script.metrics',
  ],
};

export const services: ServiceDefinition[] = [
  {
    name: 'bluedot-app-template',
    spec: {
      containers: [{
        name: 'bluedot-app-template',
        image: 'ghcr.io/bluedotimpact/bluedot-app-template:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['app-template.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-frontend-example',
    spec: {
      containers: [{
        name: 'bluedot-frontend-example',
        image: 'ghcr.io/bluedotimpact/bluedot-frontend-example:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['frontend-example.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-website-proxy',
    spec: {
      containers: [{
        name: 'bluedot-website-proxy',
        image: 'ghcr.io/bluedotimpact/bluedot-website-proxy:latest',
      }],
    },
    hosts: ['website-proxy.k8s.bluedot.org', 'www.bluedot.org', 'bluedot.org', 'www.aisafetyfundamentals.com', 'aisafetyfundamentals.com', 'www.biosecurityfundamentals.com', 'biosecurityfundamentals.com', 'course.bluedot.org', 'course.aisafetyfundamentals.com', 'course.biosecurityfundamentals.com'],
  },
  {
    name: 'bluedot-website',
    spec: {
      containers: [{
        name: 'bluedot-website',
        image: 'ghcr.io/bluedotimpact/bluedot-website:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'CLIENT_ERRORS_SLACK_CHANNEL_ID', value: CLIENT_ERRORS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
          { name: 'KEYCLOAK_CLIENT_ID', valueFrom: envVarSources.keycloakClientId },
          { name: 'KEYCLOAK_CLIENT_SECRET', valueFrom: envVarSources.keycloakClientSecret },
          { name: 'NEXT_PUBLIC_SITE_URL', value: 'https://website-staging.k8s.bluedot.org' },
          { name: 'CERTIFICATE_CREATION_TOKEN', valueFrom: envVarSources.certificateCreationToken },
          { name: 'LUMA_API_KEY', valueFrom: envVarSources.lumaApiKey },
          { name: 'CIO_APP_API_KEY', valueFrom: envVarSources.cioAppApiKey },
          { name: 'CIO_TRACK_API_KEY', valueFrom: envVarSources.cioTrackApiKey },
          { name: 'CIO_HMAC_SECRET', valueFrom: envVarSources.cioHmacSecret },
        ],
      }],
    },
    hosts: ['website-staging.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-website-production',
    spec: {
      containers: [{
        name: 'bluedot-website-production',
        image: 'ghcr.io/bluedotimpact/bluedot-website-production:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'CLIENT_ERRORS_SLACK_CHANNEL_ID', value: CLIENT_ERRORS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
          { name: 'KEYCLOAK_CLIENT_ID', valueFrom: envVarSources.keycloakClientId },
          { name: 'KEYCLOAK_CLIENT_SECRET', valueFrom: envVarSources.keycloakClientSecret },
          { name: 'KEYCLOAK_PREVIEW_CLIENT_ID', valueFrom: envVarSources.keycloakPreviewClientId },
          { name: 'KEYCLOAK_PREVIEW_CLIENT_SECRET', valueFrom: envVarSources.keycloakPreviewClientSecret },
          { name: 'KEYCLOAK_PREVIEW_AUTH_TOKEN', valueFrom: envVarSources.keycloakPreviewAuthToken },
          { name: 'NEXT_PUBLIC_SITE_URL', value: 'https://bluedot.org' },
          { name: 'CERTIFICATE_CREATION_TOKEN', valueFrom: envVarSources.certificateCreationToken },
          { name: 'LUMA_API_KEY', valueFrom: envVarSources.lumaApiKey },
          { name: 'CIO_APP_API_KEY', valueFrom: envVarSources.cioAppApiKey },
          { name: 'CIO_TRACK_API_KEY', valueFrom: envVarSources.cioTrackApiKey },
          { name: 'CIO_HMAC_SECRET', valueFrom: envVarSources.cioHmacSecret },
        ],
      }],
    },
    hosts: ['website-production.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-storybook',
    spec: {
      containers: [{
        name: 'bluedot-storybook',
        image: 'ghcr.io/bluedotimpact/bluedot-storybook:latest',
      }],
    },
    hosts: ['storybook.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-editor',
    spec: {
      containers: [{
        name: 'bluedot-editor',
        image: 'ghcr.io/bluedotimpact/bluedot-editor:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
          { name: 'WEBSITE_ASSETS_BUCKET_ACCESS_KEY_ID', value: websiteAssetsBucket.readWriteUser.name },
          { name: 'WEBSITE_ASSETS_BUCKET_SECRET_ACCESS_KEY', value: websiteAssetsBucket.readWriteUser.secret },
        ],
      }],
    },
    hosts: ['editor.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-posthog-proxy',
    spec: {
      containers: [{
        name: 'bluedot-posthog-proxy',
        image: 'ghcr.io/bluedotimpact/bluedot-posthog-proxy:latest',
      }],
    },
    hosts: ['analytics.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-meet',
    spec: {
      containers: [{
        name: 'bluedot-meet',
        image: 'ghcr.io/bluedotimpact/bluedot-meet:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'NEXT_PUBLIC_ZOOM_CLIENT_ID', value: 'lX1NBglbQWO2ERYSS1xdfA' },
          { name: 'ZOOM_CLIENT_SECRET', valueFrom: envVarSources.meetZoomClientSecret },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['meet.bluedot.org'],
  },
  {
    name: 'bluedot-availability',
    spec: {
      containers: [{
        name: 'bluedot-availability',
        image: 'ghcr.io/bluedotimpact/bluedot-availability:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['availability.bluedot.org'],
  },
  {
    name: 'bluedot-room',
    spec: {
      containers: [{
        name: 'bluedot-room',
        image: 'ghcr.io/bluedotimpact/bluedot-room:latest',
        env: [
          { name: 'DISPLAY_BEARER_TOKEN', valueFrom: envVarSources.roomDisplayBearerToken },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['room.bluedot.org'],
  },
  {
    name: 'bluedot-course-demos',
    spec: {
      containers: [{
        name: 'bluedot-course-demos',
        image: 'ghcr.io/bluedotimpact/bluedot-course-demos:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ANTHROPIC_API_KEY', valueFrom: envVarSources.anthropicApiKey },
          { name: 'OPENAI_API_KEY', valueFrom: envVarSources.openaiApiKey },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['course-demos.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-speed-review',
    spec: {
      containers: [{
        name: 'bluedot-speed-review',
        image: 'ghcr.io/bluedotimpact/bluedot-speed-review:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['speed-review.k8s.bluedot.org'],
  },
  // {
  //   name: 'bluedot-backend',
  //   spec: {
  //     containers: [{
  //       name: 'bluedot-backend',
  //       image: 'ghcr.io/bluedotimpact/bluedot-backend:latest',
  //       env: [{
  //         name: 'DATABASE_CONNECTION_STRING',
  //         value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `postgresql://postgres:${password}@${ip}:5432/postgres?sslmode=no-verify`),
  //       }],
  //     }],
  //   },
  //   hosts: ['backend.bluedot.org'],
  // },
  {
    name: 'bluedot-login',
    spec: {
      containers: [{
        name: 'bluedot-login',
        image: 'ghcr.io/bluedotimpact/bluedot-login:latest',
        env: [
          { name: 'KC_DB_URL', valueFrom: getConnectionDetails(keycloakPg).jdbcUri },
        ],
        startupProbe: {
          httpGet: { path: '/health/started', port: 9000 },
          failureThreshold: 18,
        },
        livenessProbe: {
          httpGet: { path: '/health/live', port: 9000 },
        },
        readinessProbe: {
          httpGet: { path: '/health/ready', port: 9000 },
        },
        resources: {
          limits: {
            memory: '1000Mi',
          },
        },
      }],
    },
    hosts: ['login.bluedot.org'],
  },
  {
    name: 'bluedot-pg-sync-service',
    spec: {
      containers: [{
        name: 'bluedot-pg-sync-service',
        image: 'ghcr.io/bluedotimpact/bluedot-pg-sync-service:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'PG_URL', valueFrom: getConnectionDetails(airtableSyncPg).uri },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: ALERTS_SLACK_CHANNEL_ID },
          { name: 'INFO_SLACK_CHANNEL_ID', value: INFO_SLACK_CHANNEL_ID },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
          { name: 'PROD_ONLY_WEBHOOK_DELETION', valueFrom: envVarSources.prodOnlyWebhookDeletion },
        ],
      }],
    },
  },
  {
    name: 'minio',
    spec: {
      containers: [{
        name: 'minio',
        image: 'minio/minio:RELEASE.2025-04-22T22-12-26Z',
        args: ['server', '/data', '--address', ':8080'],
        env: [
          { name: 'MINIO_ROOT_USER', value: 'root' },
          { name: 'MINIO_ROOT_PASSWORD', valueFrom: envVarSources.minioRootPassword },
          { name: 'MINIO_BROWSER', value: 'false' },
        ],
        volumeMounts: [
          {
            name: 'minio-data',
            mountPath: '/data',
          },
        ],
        readinessProbe: {
          httpGet: {
            path: '/minio/health/ready',
            port: 8080,
          },
        },
      }],
      volumes: [
        {
          name: 'minio-data',
          persistentVolumeClaim: {
            claimName: minioPvc.metadata.name,
          },
        },
      ],
    },
    hosts: ['storage.k8s.bluedot.org'],
  },
  // Google Workspace MCP server (gmail/drive/calendar/docs/sheets/forms/slides/tasks/contacts/appscript).
  // Runs the workspace-mcp PyPI package directly via uvx; users OAuth to their own Google account on first use.
  {
    name: 'bluedot-mcp-google-workspace',
    spec: {
      containers: [{
        name: 'bluedot-mcp-google-workspace',
        image: 'ghcr.io/astral-sh/uv:python3.13-bookworm-slim@sha256:531f855bda2c73cd6ef67d56b733b357cea384185b3022bd09f05e002cd144ca',
        command: ['uvx', 'workspace-mcp==1.18.0', '--transport', 'streamable-http', '--tools', 'gmail', 'drive', 'calendar', 'docs', 'sheets', 'forms', 'slides', 'tasks', 'contacts', 'appscript'],
        env: [
          { name: 'WORKSPACE_MCP_PORT', value: '8080' },
          { name: 'WORKSPACE_EXTERNAL_URL', value: `https://${MCP_GOOGLE_HOST}` },
          { name: 'MCP_ENABLE_OAUTH21', value: 'true' },
          { name: 'GOOGLE_MCP_CREDENTIALS_DIR', value: '/app/data/credentials' },
          { name: 'GOOGLE_OAUTH_CLIENT_ID', valueFrom: envVarSources.mcpGoogleOauthClientId },
          { name: 'GOOGLE_OAUTH_CLIENT_SECRET', valueFrom: envVarSources.mcpGoogleOauthClientSecret },
        ],
        volumeMounts: [{
          name: 'mcp-data-volume',
          mountPath: '/app/data',
        }],
      }],
      volumes: [{
        name: 'mcp-data-volume',
        persistentVolumeClaim: {
          claimName: mcpGoogleDataPvc.metadata.name,
        },
      }],
    },
    hosts: [MCP_GOOGLE_HOST],
  },
  // Ashby MCP server. ashby-mcp itself is stdio-only, so mcp-auth-wrapper exposes it as
  // streamable-HTTP behind Google sign-in; each user supplies their own Ashby API key via a web form.
  {
    name: 'bluedot-mcp-ashby',
    spec: {
      containers: [{
        name: 'bluedot-mcp-ashby',
        image: 'ghcr.io/domdomegg/mcp-auth-wrapper:1.2.0@sha256:fd2fb6d3c952349423b3dfac2c1bb4ecc18cadbe0b37d0c842d6570506695453',
        env: [{
          name: 'MCP_AUTH_WRAPPER_CONFIG',
          value: jsonStringify({
            command: ['npx', '-y', 'ashby-mcp'],
            auth: mcpIdentityAuth,
            envPerUser: [
              {
                name: 'ASHBY_API_KEY', label: 'Ashby API Key', description: 'Get this from Ashby admin → Integrations → API keys', secret: true,
              },
            ],
            storage: '/app/data/mcp.sqlite',
            issuerUrl: `https://${MCP_ASHBY_HOST}`,
            port: 8080,
            secret: config.requireSecret('mcpAuthWrapperSecret'),
          }),
        }],
        volumeMounts: [{
          name: 'mcp-data-volume',
          mountPath: '/app/data',
        }],
      }],
      volumes: [{
        name: 'mcp-data-volume',
        persistentVolumeClaim: {
          claimName: mcpAshbyDataPvc.metadata.name,
        },
      }],
      // fsGroup so the node user (uid 1000) can write to the PVC mount
      securityContext: { fsGroup: 1000 },
    },
    hosts: [MCP_ASHBY_HOST],
  },
  // MCP aggregator: single streamable-HTTP endpoint behind Google sign-in that fronts the two
  // self-hosted servers above plus six vendor-hosted MCPs. See https://github.com/domdomegg/mcp-aggregator
  {
    name: 'bluedot-mcp-aggregator',
    spec: {
      containers: [{
        name: 'bluedot-mcp-aggregator',
        image: 'ghcr.io/domdomegg/mcp-aggregator:2.0.1@sha256:990a63a45a29a5a7258202c2803f8ac8e5717fa90cd4dce1afb8580d0decc3ea',
        env: [{
          name: 'MCP_AGGREGATOR_CONFIG',
          value: jsonStringify({
            auth: mcpWorkspaceAuth,
            upstreams: [
              { name: 'ashby', url: `https://${MCP_ASHBY_HOST}/mcp` },
              { name: 'google', url: `https://${MCP_GOOGLE_HOST}/mcp` },
              { name: 'slack', url: 'https://mcp.slack.com/mcp' },
              { name: 'airtable', url: 'https://mcp.airtable.com/mcp' },
              { name: 'notion', url: 'https://mcp.notion.com/mcp' },
              { name: 'posthog', url: 'https://mcp-eu.posthog.com/mcp' },
              { name: 'granola', url: 'https://mcp.granola.ai/mcp' },
              { name: 'customerio', url: 'https://mcp.customer.io/mcp' },
            ],
            storage: '/app/data/mcp-aggregator.sqlite',
            issuerUrl: `https://${MCP_AGGREGATOR_HOST}`,
            port: 8080,
            secret: config.requireSecret('mcpAggregatorSecret'),
          }),
        }],
        volumeMounts: [{
          name: 'mcp-data-volume',
          mountPath: '/app/data',
        }],
      }],
      volumes: [{
        name: 'mcp-data-volume',
        persistentVolumeClaim: {
          claimName: mcpAggregatorDataPvc.metadata.name,
        },
      }],
      securityContext: { fsGroup: 1000 },
    },
    hosts: [MCP_AGGREGATOR_HOST],
  },
];

type ServiceDefinition = {
  /**
   * A name for the service. It should be unique and kebab case.
   * This gets used in the names of Pulumi and Kubernetes resources.
   *
   * @example my-cool-app
   * */
  name: string;

  /**
   * Kubernetes pod specification, which generally describes what container(s) you want and configures them e.g. with environment variables. @see https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodSpec
   *
   * @example {
   *   containers: [{
   *     name: 'bluedot-my-cool-app',
   *     image: 'ghcr.io/bluedotimpact/bluedot-my-cool-app:latest',
   *     env: [
   *       { name: 'SOME_USEFUL_ENV_VAR', value: 'my not secret value' },
   *       { name: 'SOME_SECRET_ENV_VAR', valueFrom: envVarSources.mySecret },
   *     ],
   *   }],
   * }
   * */
  spec: core.v1.PodSpec;

  /**
   * What hostnames you want to your application on.
   * If you are not using a *.k8s.bluedot.org domain, you'll need to add this in Porkbun: add an A record pointing at the IP of the Kubernetes cluster (see the entry for *.k8s.bluedot.org in Porkbun and copy that).
   *
   * @example ['my-cool-app.k8s.bluedot.org']
   * */
  hosts?: string[];

  /**
   * The port the container serves requests on.
   * For most apps this should be 8080 (update your Dockerfile if not), and you can leave this out.
   *
   * @default 8080
   * */
  targetPort?: number;
};
