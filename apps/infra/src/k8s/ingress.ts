import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

new k8s.core.v1.Namespace('ingress-nginx-namespace', {
  metadata: {
    name: 'ingress-nginx',
  },
}, { provider });

new k8s.helm.v3.Release('ingress-nginx', {
  chart: 'ingress-nginx',
  repositoryOpts: {
    repo: 'https://kubernetes.github.io/ingress-nginx',
  },
  namespace: 'ingress-nginx',
  values: {
    controller: {
      config: {
        'force-ssl-redirect': 'true',
      },
      ingressClassResource: {
        default: 'true',
      },
    },
  },
}, { provider });
