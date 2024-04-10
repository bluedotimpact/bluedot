import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import { containerRegistryDockerConfigJson } from '../config';

export const containerRegistrySecret = new k8s.core.v1.Secret('vultr-cr-secret', {
  metadata: {
    name: 'vultr-cr-credentials',
  },
  data: {
    '.dockerconfigjson': containerRegistryDockerConfigJson,
  },
  type: 'kubernetes.io/dockerconfigjson',
}, { provider });
