export const registerDefaultInstrumentation = async (env: { APP_NAME: string }) => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { WinstonInstrumentation } = await import('@opentelemetry/instrumentation-winston');
  const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
  const { PeriodicExportingMetricReader } = await import('@opentelemetry/sdk-metrics');
  const { resourceFromAttributes } = await import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');

  // Create a custom Winston instrumentation
  const winstonInstrumentation = new WinstonInstrumentation({
    logHook(span, record) {
      const { attributes } = (span as unknown as { attributes?: Record<string, string> });

      const attributesToAdd = ['http.method', 'http.url', 'user.email'];
      for (const attribute of attributesToAdd) {
        record[attribute] = attributes?.[attribute];
      }
    },

    // The OTel collector already captures logs from stdout
    disableLogSending: true,
  });

  // Create a resource that identifies this service
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: env.APP_NAME,
  });

  // Initialize the OpenTelemetry SDK
  const sdk = new NodeSDK({
    resource,
    metricReader: new PeriodicExportingMetricReader({
      // Since the collector is deployed as a daemonset, it runs on every node so we can access it at localhost
      exporter: new OTLPMetricExporter({
        url: 'http://opentelemetry-collector.monitoring:4318/v1/metrics',
      }),
    }),
    instrumentations: [winstonInstrumentation],
  });

  // Start the SDK
  sdk.start();
};
