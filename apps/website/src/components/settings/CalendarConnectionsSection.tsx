import { A, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import CalendarConnectionList from './CalendarConnectionList';

// Hidden for most people: it only appears once someone has connected a calendar. Connecting happens on /account/calendars.
const CalendarConnectionsSection = () => {
  const { data: connections } = trpc.calendarConnections.list.useQuery();

  if (!connections?.length) {
    return null;
  }

  return (
    <>
      <section className="mb-6 flex flex-col gap-4" aria-labelledby="connected-calendars-heading">
        <div>
          <h2 id="connected-calendars-heading" className="bluedot-p font-semibold mb-2">Connected calendars</h2>
          <P className="max-w-prose text-secondary">
            We use these to schedule your 1-1 chats at times you're free. We only see when you're busy, never what your
            events are. <A href={ROUTES.calendars.url}>Add or manage calendars</A>
          </P>
        </div>
        <CalendarConnectionList connections={connections} />
      </section>

      <div className="border-t border-default my-6" />
    </>
  );
};

export default CalendarConnectionsSection;
