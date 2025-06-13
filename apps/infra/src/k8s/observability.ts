import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import { getConnectionDetails, grafanaPg } from './postgres';
import { ingressNginx } from './ingress';
import { certManager } from './certManager';
import { lokiBuckets } from '../minio';

// Observability Stack Data Flow
//
// +--------------+
// | Applications |
// +--------------+
//         |
//         | (metrics, logs)
//         v
// +---------------+
// | OpenTelemetry |
// |   Collector   |
// +---------------+
//      |       |
//      |       +------------------+
//      |                          |
//      | (metrics)                | (logs)
//      v                          v
// +------------------+    +---------------+
// | Prometheus       |    | Loki          |
// | (metric storage) |    | (log storage) |
// +------------------+    +---------------+
//      |                          |
//      |                          |
//      +---------------+----------+
//                      |
//                      v
//           +----------------------+
//           |       Grafana        |
//           | (dashboards, alerts) |
//           +----------------------+
//
// Data Flow:
// 1. There are multiple applications, across multiple kubernetes nodes. These produce metrics and logs.
//    - Metrics are sent via the OpenTelemetry SDK to a collector. In Next.js apps this is set up with instrumentation.ts.
//    - Logs are sent by logging them to stdout (e.g. with console.log or Winston). Kubernetes automatically saves these logs to files.
// 2. The OpenTelemetry Collector collects these metrics and logs, enriches them, and sends them on to Prometheus and Loki.
//    - It operates on every node (computer) in the Kubernetes cluster
//    - For metrics, it hosts a HTTP server using the OTLP standard which apps can send metrics to
//    - For logs, it collects logs from Kubernetes's saved log files
//    - It also adds some metadata, e.g. what service and node the metrics or logs are from
//    - It then sends the enriched metrics and logs data on to Prometheus and Loki
//    - The reason we use the OpenTelemetry Collector, instead of apps sending directly to Prometheus and Loki, is:
//      - For custom apps, we can add custom code to send logs and metrics to the right servers. But for off-the-shelf software (e.g. nginx), we can't do this - so need something to collect logs etc.
//      - Even for our custom apps, with the OTel collector we can easily change where we want to send logs and metrics, without making code changes to every app. This allows us to easily experiment to find the best tools, and avoids vendor lock-in.
//      - The collector enriches the data, so that the data is easier to use.
// 3. Prometheus and Loki store and index metrics and logs respectively
// 4. Grafana queries both Prometheus and Loki to create dashboards and alerts
//    - Developers can login to view the data at grafana.k8s.bluedot.org

// Prometheus + Grafana
const grafanaService = {
  name: 'grafana',
  hosts: ['grafana.k8s.bluedot.org'],
};
const kubePrometheus = new k8s.helm.v3.Release('kube-prometheus', {
  name: 'kube-prometheus-stack',
  chart: 'kube-prometheus-stack',
  repositoryOpts: {
    repo: 'https://prometheus-community.github.io/helm-charts',
  },
  createNamespace: true,
  namespace: 'monitoring',
  values: {
    // Disable collecting these metrics in kube-prometheus-stack since we collect these via the OpenTelemetry Collector
    nodeExporter: {
      enabled: false,
    },
    kubelet: {
      enabled: false,
    },
    // Disable alerting given we do this in Grafana
    defaultRules: {
      create: false,
    },
    alertmanager: {
      enabled: false,
    },
    grafana: {
      env: {
        GF_DATABASE_TYPE: 'postgres',
        GF_DATABASE_HOST: getConnectionDetails(grafanaPg).host,
        GF_DATABASE_NAME: getConnectionDetails(grafanaPg).database,
        GF_DATABASE_USER: getConnectionDetails(grafanaPg).username,

        GF_SERVER_ROOT_URL: `https://${grafanaService.hosts[0]}/`,
        GF_AUTH_DISABLE_LOGIN_FORM: 'true',
        GF_AUTH_GENERIC_OAUTH_ENABLED: 'true',
        GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP: 'true',
        GF_AUTH_GENERIC_OAUTH_AUTO_LOGIN: 'true',
        GF_AUTH_GENERIC_OAUTH_CLIENT_ID: 'grafana',
        GF_AUTH_GENERIC_OAUTH_USE_PKCE: 'true',
        GF_AUTH_GENERIC_OAUTH_AUTH_URL: 'https://login.bluedot.org/realms/master/protocol/openid-connect/auth',
        GF_AUTH_GENERIC_OAUTH_TOKEN_URL: 'https://login.bluedot.org/realms/master/protocol/openid-connect/token',
        GF_AUTH_GENERIC_OAUTH_SIGNOUT_REDIRECT_URL: `https://login.bluedot.org/realms/master/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(`https://${grafanaService.hosts[0]}/`)}`,
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
new k8s.networking.v1.Ingress(`${grafanaService.name}-ingress`, {
  metadata: {
    namespace: 'monitoring',
    name: `${grafanaService.name}-ingress`,
    annotations: {
      'kubernetes.io/ingress.class': 'nginx',
      'cert-manager.io/cluster-issuer': 'cert-manager-issuer',
    },
  },
  spec: {
    tls: [{
      hosts: grafanaService.hosts,
      secretName: `${grafanaService.name}-certificate`,
    }],
    rules: grafanaService.hosts.map((host) => ({
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

// OpenTelemetry Collector
new k8s.helm.v3.Release('opentelemetry-collector', {
  name: 'opentelemetry-collector',
  chart: 'opentelemetry-collector',
  repositoryOpts: {
    repo: 'https://open-telemetry.github.io/opentelemetry-helm-charts',
  },
  namespace: 'monitoring',
  values: {
    mode: 'daemonset',
    image: {
      repository: 'ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector-contrib',
    },
    command: {
      name: 'otelcol-contrib',
    },
    presets: {
      // Collect logs from Kubernetes containers
      logsCollection: {
        enabled: true,
        includeCollectorLogs: true,
      },
      // Collect node, pod and container metrics from the kubelet
      hostMetrics: {
        enabled: true,
      },
      kubeletMetrics: {
        enabled: true,
      },
      // Add Kubernetes metadata to telemetry
      kubernetesAttributes: {
        enabled: true,
      },
    },
    config: {
      // Receive OTLP data from applications
      receivers: {
        otlp: {
          protocols: {
            http: {},
          },
        },
      },
      exporters: {
        // Expose metrics for Prometheus
        prometheus: {
          endpoint: '0.0.0.0:8889',
        },
        // Send logs to Loki
        'otlphttp/loki': {
          endpoint: 'http://loki:3100/otlp',
        },
      },
      service: {
        pipelines: {
          metrics: {
            receivers: ['otlp'],
            processors: ['memory_limiter', 'batch'],
            exporters: ['prometheus'],
          },
          logs: {
            receivers: ['otlp'],
            processors: ['memory_limiter', 'batch'],
            exporters: ['otlphttp/loki'],
          },
          // For later: send traces to Tempo?
          // traces: {
          //   receivers: ['otlp'],
          //   processors: ['memory_limiter', 'batch'],
          //   exporters: ['otlp'],
          // },
        },
      },
    },
    // So we can have Prometheus pull from the OpenTelemetry Collector
    ports: {
      'prom-exporter': {
        enabled: true,
        containerPort: 8889,
        servicePort: 8889,
        hostPort: 8889,
        protocol: 'TCP',
      },
    },
    podMonitor: {
      enabled: true,
      metricsEndpoints: [{
        port: 'prom-exporter',
      }],
      extraLabels: {
        release: 'kube-prometheus-stack',
      },
    },
    // So the nodes can push to the OpenTelemetry Collector
    // Alternative considered: we could get the node IP and use the exposed port, but injecting extra environment variables is more hassle
    // See https://github.com/open-telemetry/opentelemetry-helm-charts/issues/749
    service: {
      enabled: true,
    },
  },
}, { provider });

// Loki
new k8s.helm.v3.Release('loki', {
  name: 'loki',
  chart: 'loki',
  repositoryOpts: {
    repo: 'https://grafana.github.io/helm-charts',
  },
  namespace: 'monitoring',
  values: {
    loki: {
      commonConfig: {
        replication_factor: 1,
      },
      schemaConfig: {
        configs: [
          {
            from: '2024-04-01',
            store: 'tsdb',
            object_store: 's3',
            schema: 'v13',
            index: {
              prefix: 'loki_index_',
              period: '24h',
            },
          },
        ],
      },
      pattern_ingester: {
        enabled: true,
      },
      limits_config: {
        allow_structured_metadata: true,
        volume_enabled: true,
      },
      storage: {
        s3: {
          s3: 'https://storage.k8s.bluedot.org',
          accessKeyId: lokiBuckets.readWriteUser.name,
          secretAccessKey: lokiBuckets.readWriteUser.secret,
          s3ForcePathStyle: true,
        },
        bucketNames: {
          chunks: 'loki-chunks',
          ruler: 'loki-ruler',
          admin: 'loki-admin',
        },
      },
      // We have no need for multitenancy, so we disable auth_enabled
      // https://grafana.com/docs/loki/latest/operations/multi-tenancy/
      auth_enabled: false,
    },
    deploymentMode: 'SingleBinary',
    singleBinary: {
      replicas: 1,
    },
    // Disable things we don't need
    selfMonitoring: {
      enabled: false,
    },
    lokiCanary: {
      enabled: false,
    },
    test: {
      enabled: false,
    },
    // Zero out replica counts of other deployment modes
    backend: {
      replicas: 0,
    },
    read: {
      replicas: 0,
    },
    write: {
      replicas: 0,
    },
    ingester: {
      replicas: 0,
    },
    querier: {
      replicas: 0,
    },
    queryFrontend: {
      replicas: 0,
    },
    queryScheduler: {
      replicas: 0,
    },
    distributor: {
      replicas: 0,
    },
    compactor: {
      replicas: 0,
    },
    indexGateway: {
      replicas: 0,
    },
    bloomCompactor: {
      replicas: 0,
    },
    bloomGateway: {
      replicas: 0,
    },
  },
}, { provider });
