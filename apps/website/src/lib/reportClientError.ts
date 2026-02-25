const reported = new Set<string>();

export function reportClientError(
  error: { message: string; stack?: string; componentStack?: string },
  source: 'window.onerror' | 'unhandledrejection' | 'errorboundary' | 'error-page',
) {
  try {
    if (typeof window === 'undefined') return;

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

    fetch('/api/report-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      keepalive: true,
    }).catch(() => {});
  } catch {
    try {
      let pageUrl = 'unknown';
      try {
        pageUrl = window.location.href.slice(0, 2000);
      } catch { /* ignore */ }

      let userAgent = 'unknown';
      try {
        userAgent = navigator.userAgent.slice(0, 500);
      } catch { /* ignore */ }

      fetch('/api/report-client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'reportClientError itself threw',
          pageUrl,
          userAgent,
          timestamp: new Date().toISOString(),
          source,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // truly give up silently
    }
  }
}
