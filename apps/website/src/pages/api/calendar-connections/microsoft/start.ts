import { makeCalendarStartRoute } from '../../../../lib/api/calendarConnectRoutes';
import { buildMicrosoftAuthUrl } from '../../../../lib/api/microsoftCalendar';

export default makeCalendarStartRoute({ buildAuthUrl: buildMicrosoftAuthUrl });
