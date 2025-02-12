import { GoogleAnalytics } from '@next/third-parties/google';
import { isAnalyticsEnabled, GA_MEASUREMENT_ID } from '../lib/analytics'

export default function Analytics() {
  if (!isAnalyticsEnabled()) {
    return null
  }
  
  return <GoogleAnalytics gaId={`${GA_MEASUREMENT_ID}`} />
}
