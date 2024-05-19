import * as k8s from '@pulumi/kubernetes';
import { core } from '@pulumi/kubernetes/types/input';
import { provider } from './provider';
import { config } from '../config';

// These Pulumi secrets will be converted to K8s secrets automatically
const toK8s = [
  'airtablePat',
  'alertsSlackBotToken',
  'meetZoomClientSecret',
  'keycloakAdminPassword',
  'loginProxySharedSecret',
  'loginProxyKeycloakClientSecret',
] as const;

export const envVarSources = toK8s.reduce((obj, key) => {
  const resource = new k8s.core.v1.Secret(`${key.toLowerCase()}-secret`, {
    metadata: {
      name: `${key.toLowerCase()}-secret`,
    },
    stringData: {
      value: config.requireSecret(key),
    },
  }, { provider });

  // eslint-disable-next-line no-param-reassign
  obj[key] = { secretKeyRef: { name: resource.metadata.name, key: 'value' } };
  return obj;
}, {} as Record<typeof toK8s[number], core.v1.EnvVarSource>);

export const containerRegistrySecret = new k8s.core.v1.Secret('vultr-cr-secret', {
  metadata: {
    name: 'vultr-cr-credentials',
  },
  data: {
    '.dockerconfigjson': config.requireSecret('containerRegistryDockerConfigJson'),
  },
  type: 'kubernetes.io/dockerconfigjson',
}, { provider });
