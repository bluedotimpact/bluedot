import posthog from 'posthog-js';

export const appendPosthogSessionIdPrefill = (url: string): string => {
  if (!url) return url;
  // new URL() requires an absolute URL; skip relative paths (e.g. internal nav links)
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;

  const sessionId = posthog.get_session_id?.();
  if (!sessionId) return url;

  const urlObj = new URL(url);
  urlObj.searchParams.set('prefill_PostHog Session ID', sessionId);
  // URLSearchParams encodes spaces as '+', but miniextensions requires '%20'
  return urlObj.toString().replace('prefill_PostHog+Session+ID', 'prefill_PostHog%20Session%20ID');
};
