import { initTRPC } from '@trpc/server';
// eslint-disable-next-line import/no-extraneous-dependencies
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';

// Avoid exporting the entire t-object since it's not very descriptive.
// For instance, the use of a t variable is common in i18n libraries.
const t = initTRPC.create();

// OpenTelemetry setup
const meter = metrics.getMeter('api-routes');
const requestCounter = meter.createCounter('api_requests_total', {
  description: 'Total number of API requests',
});

const openTelemetryMiddleware = t.middleware(async (opts) => {
  const { type, path } = opts;

  let method = 'UNKNOWN';
  if (type === 'query') method = 'GET';
  else if (type === 'mutation') method = 'POST';

  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute('http.method', method);
  activeSpan?.setAttribute('http.url', path);

  let statusCode = 200;

  try {
    const result = await opts.next();

    // Set span attributes for success
    activeSpan?.setAttribute('http.status_code', statusCode);
    activeSpan?.setStatus({ code: SpanStatusCode.OK });
    requestCounter.add(1, {
      method,
      path,
      status_code: statusCode.toString(),
    });

    return result;
  } catch (error) {
    // Set span attributes for error
    statusCode = 500;
    activeSpan?.setAttribute('http.status_code', statusCode);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    requestCounter.add(1, {
      method,
      path,
      status_code: statusCode.toString(),
    });

    throw error;
  }
});

// Base router and procedure helpers
export const { router } = t;
export const publicProcedure = t.procedure.use(openTelemetryMiddleware);
