import { makeCalendarCallbackHandler } from '../../../../lib/api/calendarConnectRoutes';
import { exchangeMicrosoftCode, hasMicrosoftCalendarScope } from '../../../../lib/api/microsoftCalendar';

// AADSTS65001: no consent yet and the person can't give it. AADSTS90094 / AADSTS90095: their organisation requires
// an admin to approve the app. Either way, only their IT team can unblock it.
const NEEDS_ADMIN_CODES = /AADSTS(65001|90094|90095)\b/;

export default makeCalendarCallbackHandler({
  provider: 'microsoft',
  exchangeCode: exchangeMicrosoftCode,
  hasCalendarScope: hasMicrosoftCalendarScope,
  classifyProviderError: ({ error, description }) => {
    if (description && NEEDS_ADMIN_CODES.test(description)) return 'needs_admin';
    if (error === 'access_denied') return 'cancelled';
    if (error === 'consent_required') return 'needs_admin';
    return 'failed';
  },
});
