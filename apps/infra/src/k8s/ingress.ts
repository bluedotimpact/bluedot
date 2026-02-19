import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const ingressNginx = new k8s.helm.v3.Release('ingress-nginx', {
  chart: 'ingress-nginx',
  version: '4.13.1',
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

        // Disable strict path validation, to work around a bug in ingress-nginx
        // https://cert-manager.io/docs/releases/release-notes/release-notes-1.18/#acme-http01-challenge-paths-now-use-pathtype-exact-in-ingress-routes
        // https://github.com/kubernetes/ingress-nginx/issues/11176
        'strict-validate-path-type': false,

        // Enable PROXY protocol so ingress-nginx can read the real client IP
        // from the Vultr Load Balancer (which otherwise NATs the connection)
        'use-proxy-protocol': 'true',
      },
      ingressClassResource: {
        default: 'true',
      },
      service: {
        annotations: {
          // Tell the Vultr Load Balancer to send PROXY protocol headers
          'service.beta.kubernetes.io/vultr-loadbalancer-proxy-protocol': 'true',
        },
      },
    },
    // This enables public connections to the airtable-sync-pg database
    // For others, use `./tools/connectDb.sh` or `kubectl port-forward svc/postgres-cluster-rw 5433:5432`
    tcp: {
      5432: 'default/airtable-sync-pg-rw:5432',
    },
  },
}, { provider });
