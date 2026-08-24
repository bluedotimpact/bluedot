import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

// VKE nodes ship with kernel-default inotify limits (max_user_instances=128), which the
// pods on a node exhaust ("failed to create fsnotify watcher: too many open files").
// Vultr has no node-level config hook, so raise them from a DaemonSet instead: the
// drop-in file survives reboots, `sysctl -w` applies them immediately.
const inotifySysctls = {
  'fs.inotify.max_user_instances': 8192,
  'fs.inotify.max_user_watches': 1048576,
};

const settings = Object.entries(inotifySysctls).map(([k, v]) => `${k}=${v}`);

new k8s.apps.v1.DaemonSet('node-sysctl', {
  metadata: { name: 'node-sysctl', namespace: 'kube-system' },
  spec: {
    selector: { matchLabels: { app: 'node-sysctl' } },
    template: {
      metadata: { labels: { app: 'node-sysctl' } },
      spec: {
        tolerations: [{ operator: 'Exists' }],
        priorityClassName: 'system-node-critical',
        initContainers: [{
          name: 'apply',
          image: 'busybox:1.36',
          command: ['sh', '-euc', [
            `printf '%s\\n' ${settings.map((s) => `'${s}'`).join(' ')} > /host/etc/sysctl.d/99-bluedot-inotify.conf`,
            `sysctl -w ${settings.join(' ')}`,
          ].join('\n')],
          securityContext: { privileged: true },
          volumeMounts: [{ name: 'sysctl-d', mountPath: '/host/etc/sysctl.d' }],
        }],
        // A DaemonSet pod has to keep running, so park on the pause image after the init container.
        containers: [{
          name: 'pause',
          image: 'registry.k8s.io/pause:3.10',
          resources: { requests: { cpu: '1m', memory: '8Mi' }, limits: { memory: '16Mi' } },
        }],
        volumes: [{ name: 'sysctl-d', hostPath: { path: '/etc/sysctl.d', type: 'DirectoryOrCreate' } }],
      },
    },
  },
}, { provider });
