import { GoogleAnalytics } from '@next/third-parties/google';
import { isAnalyticsEnabled, isDebugModeEnabled, GA_MEASUREMENT_ID } from '../lib/analytics';

export const Analytics = () => {
  if (!isAnalyticsEnabled()) {
    return null;
  }
  const debugMode = isDebugModeEnabled();

  return <GoogleAnalytics gaId={`${GA_MEASUREMENT_ID}`} debugMode={debugMode} />;
};
