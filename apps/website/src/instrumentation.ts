export async function register() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerDefaultInstrumentation } = await import('@bluedot/ui/src/default-config/instrumentation');
    const { default: env } = await import('./lib/api/env');

    await registerDefaultInstrumentation(env);
  }
}
