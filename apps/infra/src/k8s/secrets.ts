import * as k8s from '@pulumi/kubernetes';
import { secret } from '@pulumi/pulumi';
import { type core } from '@pulumi/kubernetes/types/input';
import { provider } from './provider';
import { config } from '../config';

// These Pulumi secrets will be converted to K8s secrets automatically
const toK8s = [
  'airtablePat',
  'airtableAutomationToken',
  'alertsSlackBotToken',
  'anthropicApiKey',
  'ashbyApiKey',
  'openaiApiKey',
  'loginProxySharedSecret',
  'loginProxyKeycloakClientSecret',
  'roomDisplayBearerToken',
  'minioRootPassword',
  'keycloakClientId',
  'keycloakClientSecret',
  'keycloakPreviewClientId',
  'keycloakPreviewClientSecret',
  'keycloakPreviewAuthToken',
  'prodOnlyWebhookDeletion',
  'cioAppApiKey',
  'cioTrackApiKey',
  'cioHmacSecret',
  'emailChangeTokenSecret',
  'lumaApiKey',
  'mcpGoogleOauthClientId',
  'mcpGoogleOauthClientSecret',
  'notionApiToken',
] as const;

export const envVarSources = toK8s.reduce((obj, key) => {
  const resource = new k8s.core.v1.Secret(`${key.toLowerCase()}-secret`, {
    metadata: {
      name: `${key.toLowerCase()}-secret`,
    },
    stringData: {
      // GitHub supplies the production Ashby key; local infra previews can use Pulumi config.
      value: key === 'ashbyApiKey' && process.env.ASHBY_API_KEY
        ? secret(process.env.ASHBY_API_KEY)
        : config.requireSecret(key),
    },
  }, { provider });

  obj[key] = { secretKeyRef: { name: resource.metadata.name, key: 'value' } };
  return obj;
}, {} as Record<typeof toK8s[number], core.v1.EnvVarSource>);
