// browser only. window and navigator are not available server-side.

const reported = new Set<string>();

export function reportClientError(
  error: { message: string; stack?: string; componentStack?: string },
  source: 'window.onerror' | 'unhandledrejection' | 'errorboundary' | 'error-page',
) {
  if (typeof window === 'undefined') return;

  // same error from the same tab is reported once per page load.
  const key = `${source}:${error.message}`;
  if (reported.has(key)) return;
  reported.add(key);

  const input = {
    message: error.message.slice(0, 1000),
    stack: error.stack?.slice(0, 5000),
    componentStack: error.componentStack?.slice(0, 5000),
    pageUrl: window.location.href.slice(0, 2000),
    userAgent: navigator.userAgent.slice(0, 500),
    timestamp: new Date().toISOString(),
    source,
  };

  // plain fetch, not useMutation. useMutation requires React context.
  // window.onerror and componentDidCatch run outside React context.
  // tRPC v11 without SuperJSON uses plain JSON.stringify(input) as the body.
  fetch('/api/trpc/errors.reportClientError', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    keepalive: true, // delivers the request even if the page is unloading.
  }).catch(() => {
    // fail silently. error reporting must not cause more errors.
  });
}
