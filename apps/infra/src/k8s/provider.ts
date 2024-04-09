// import * as k8s from '@pulumi/kubernetes';
import { k8sProvider } from '../vultr/vke';

// const yamlProvider = new k8s.Provider('render-yaml', {
//   renderYamlToDirectory: 'dist/k8s',
// });

export const provider = k8sProvider;
