import { registerDefaultInstrumentation } from '@bluedot/ui/src/default-config/instrumentation';

export async function register() {
  await registerDefaultInstrumentation();
}
