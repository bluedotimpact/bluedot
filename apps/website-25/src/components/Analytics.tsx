import { GoogleAnalytics } from '@next/third-parties/google';
import { isAnalyticsEnabled, GA_MEASUREMENT_ID } from '../lib/analytics';

export const Analytics = () => {
  if (!isAnalyticsEnabled()) {
    return null;
  }

  return <GoogleAnalytics gaId={`${GA_MEASUREMENT_ID}`} />;
};