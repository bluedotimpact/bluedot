import { registerDefaultInstrumentation } from '@bluedot/ui/src/default-config/instrumentation';
import env from './lib/api/env';

export async function register() {
  await registerDefaultInstrumentation(env);
}
