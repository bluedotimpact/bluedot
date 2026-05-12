import { addQueryParam } from '@bluedot/ui';
import { appendPosthogSessionIdPrefill } from './appendPosthogSessionIdPrefill';

/**
 * Build an application form URL with PostHog session and UTM source prefill
 * params attached for attribution. Returns '' when the base URL is missing —
 * callers decide their own fallback.
 */
export const buildApplicationUrl = (
  baseUrl: string | null | undefined,
  utmSource: string | null | undefined,
): string => {
  if (!baseUrl) return '';
  return appendPosthogSessionIdPrefill(
    utmSource ? addQueryParam(baseUrl, 'prefill_Source', utmSource) : baseUrl,
  );
};
