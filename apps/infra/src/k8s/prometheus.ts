import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import { getConnectionDetails, grafanaPg } from './postgres';
import { ingressNginx } from './ingress';
import { certManager } from './certManager';

const service = {
  name: 'grafana',
  hosts: ['grafana.k8s.bluedot.org'],
};

export const kubePrometheus = new k8s.helm.v3.Release('kube-prometheus', {
  chart: 'kube-prometheus-stack',
  repositoryOpts: {
    repo: 'https://prometheus-community.github.io/helm-charts',
  },
  createNamespace: true,
  namespace: 'monitoring',
  values: {
    grafana: {
      env: {
        GF_DATABASE_TYPE: 'postgres',
        GF_DATABASE_HOST: getConnectionDetails(grafanaPg).host,
        GF_DATABASE_NAME: getConnectionDetails(grafanaPg).database,
        GF_DATABASE_USER: getConnectionDetails(grafanaPg).username,

        GF_SERVER_ROOT_URL: `https://${service.hosts[0]}/`,
        GF_AUTH_DISABLE_LOGIN_FORM: 'true',
        GF_AUTH_GENERIC_OAUTH_ENABLED: 'true',
        GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP: 'true',
        GF_AUTH_GENERIC_OAUTH_AUTO_LOGIN: 'true',
        GF_AUTH_GENERIC_OAUTH_CLIENT_ID: 'grafana',
        GF_AUTH_GENERIC_OAUTH_USE_PKCE: 'true',
        GF_AUTH_GENERIC_OAUTH_AUTH_URL: 'https://login.bluedot.org/realms/master/protocol/openid-connect/auth',
        GF_AUTH_GENERIC_OAUTH_TOKEN_URL: 'https://login.bluedot.org/realms/master/protocol/openid-connect/token',
        GF_AUTH_GENERIC_OAUTH_SIGNOUT_REDIRECT_URL: `https://login.bluedot.org/realms/master/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(`https://${service.hosts[0]}/`)}`,
        GF_AUTH_GENERIC_OAUTH_SCOPES: 'openid',
        GF_AUTH_GENERIC_OAUTH_EMAIL_ATTRIBUTE_PATH: 'email',
        GF_AUTH_GENERIC_OAUTH_LOGIN_ATTRIBUTE_PATH: 'username',
        GF_AUTH_GENERIC_OAUTH_NAME_ATTRIBUTE_PATH: 'full_name',

        GF_AUTH_SKIP_ORG_ROLE_SYNC: 'true',
        GF_USERS_AUTO_ASSIGN_ORG_ROLE: 'Admin',
      },
      envValueFrom: {
        GF_DATABASE_PASSWORD: getConnectionDetails(grafanaPg).password,
      },
    },
  },
}, { provider });

new k8s.networking.v1.Ingress(`${service.name}-ingress`, {
  metadata: {
    namespace: 'monitoring',
    name: `${service.name}-ingress`,
    annotations: {
      'kubernetes.io/ingress.class': 'nginx',
      'cert-manager.io/cluster-issuer': 'cert-manager-issuer',
    },
  },
  spec: {
    tls: [{
      hosts: service.hosts,
      secretName: `${service.name}-certificate`,
    }],
    rules: service.hosts.map((host) => ({
      host,
      http: {
        paths: [{
          path: '/',
          pathType: 'Prefix',
          backend: {
            service: {
              name: kubePrometheus.status.name.apply((n) => `${n}-grafana`),
              port: {
                name: 'http-web',
              },
            },
          },
        }],
      },
    })),
  },
}, { provider, dependsOn: [ingressNginx, certManager] });
