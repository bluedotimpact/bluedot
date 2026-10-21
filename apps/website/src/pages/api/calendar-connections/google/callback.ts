import { GOOGLE_FREEBUSY_SCOPE } from '../../../../lib/api/calendarConnect';
import { makeCalendarCallbackHandler } from '../../../../lib/api/calendarConnectRoutes';
import { exchangeGoogleCode } from '../../../../lib/api/googleCalendar';

export default makeCalendarCallbackHandler({
  provider: 'google',
  exchangeCode: exchangeGoogleCode,
  // With granular consent, people can untick the calendar permission and still sign in
  hasCalendarScope: (scopes) => scopes.includes(GOOGLE_FREEBUSY_SCOPE),
  classifyProviderError: ({ error }) => (error === 'access_denied' ? 'cancelled' : 'failed'),
});
