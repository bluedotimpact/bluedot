import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const ingressNginx = new k8s.helm.v3.Release('ingress-nginx', {
  chart: 'ingress-nginx',
  repositoryOpts: {
    repo: 'https://kubernetes.github.io/ingress-nginx',
  },
  createNamespace: true,
  namespace: 'ingress-nginx',
  values: {
    controller: {
      config: {
        // Improve security
        'force-ssl-redirect': 'true',

        // Sometimes the headers returned from Keycloak are really long
        'proxy-buffer-size': '8k',

        // Allow large file uploads
        'proxy-body-size': '100m',
      },
      ingressClassResource: {
        default: 'true',
      },
    },
    // This enables public connections to the airtable-sync-pg database
    // For others, use `./tools/connectDb.sh` or `kubectl port-forward svc/postgres-cluster-rw 5433:5432`
    tcp: {
      5432: 'default/airtable-sync-pg-rw:5432',
    },
  },
}, { provider });
