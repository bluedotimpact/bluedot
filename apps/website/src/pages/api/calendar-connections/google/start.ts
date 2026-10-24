import { makeCalendarStartRoute } from '../../../../lib/api/calendarConnectRoutes';
import { buildGoogleAuthUrl } from '../../../../lib/api/googleCalendar';

export default makeCalendarStartRoute({ buildAuthUrl: buildGoogleAuthUrl });
