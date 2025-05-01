export const registerDefaultInstrumentation = async () => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { registerOTel } = await import('@vercel/otel');
  const { WinstonInstrumentation } = await import('@opentelemetry/instrumentation-winston');

  registerOTel({
    serviceName: 'website',
    instrumentations: [
      new WinstonInstrumentation({
        logHook: (span, record) => {
          const { attributes } = (span as unknown as { attributes?: Record<string, string> });

          const attributesToAdd = ['http.method', 'http.url', 'user.email'];
          for (const attribute of attributesToAdd) {
            // eslint-disable-next-line no-param-reassign
            record[attribute] = attributes?.[attribute];
          }
        },

        // The OTel collector already captures logs from stdout
        disableLogSending: true,
      }),
    ],
  });
};
