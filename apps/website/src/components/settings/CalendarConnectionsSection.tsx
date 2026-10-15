import {
  A, Button, Callout, P,
} from '@bluedot/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ROUTES } from '../../lib/routes';
import { startGoogleCalendarConnect } from '../../lib/startCalendarConnect';
import { trpc } from '../../utils/trpc';

// Hidden for most people: it only appears once someone has connected a calendar, or has just come back from connecting one.
const CalendarConnectionsSection = () => {
  const router = useRouter();
  const justConnected = router.query.calendar === 'connected';
  const [showConnected, setShowConnected] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { data: connections, error: listError } = trpc.calendarConnections.list.useQuery();

  useEffect(() => {
    if (justConnected) {
      setShowConnected(true);
      router.replace(ROUTES.account.url, undefined, { shallow: true });
    }
  }, [justConnected, router]);

  if (!connections?.length && !showConnected) {
    return null;
  }

  const addAnother = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await startGoogleCalendarConnect({ connectToken: null });
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
      setIsStarting(false);
    }
  };

  return (
    <>
      <section className="mb-6 flex flex-col gap-4" aria-labelledby="connected-calendars-heading">
        <div>
          <h2 id="connected-calendars-heading" className="bluedot-p font-semibold mb-2">Connected calendars</h2>
          <P className="max-w-prose text-secondary">
            We use these to schedule your 1-1 chats at times you're free. We only see when you're busy, never what your
            events are. <A href={ROUTES.privacyPolicy.url}>How we use your calendar</A>
          </P>
        </div>

        {showConnected && (
          <Callout tone="success" title="Calendar connected" onDismiss={() => setShowConnected(false)} role="status">
            We'll use it to find times you're free. If you have another calendar, like a work one, add that too.
          </Callout>
        )}

        {listError && showConnected && (
          <Callout tone="error" title="We couldn't load your calendars">{listError.message}</Callout>
        )}

        {connections && connections.length > 0 && (
          <ul className="flex flex-col divide-y divide-default rounded-surface border border-default" aria-label="Connected calendars">
            {connections.map((connection) => (
              <ConnectionRow key={connection.id} connection={connection} />
            ))}
          </ul>
        )}

        {connections && connections.length > 0 && (
          <div className="flex flex-col items-start gap-2">
            <Button variant="secondary" onClick={addAnother} loading={isStarting} aria-label="Add another calendar">
              Add another calendar (e.g. your work one)
            </Button>
            {startError && <p className="text-size-sm text-error-fg" role="alert">{startError}</p>}
          </div>
        )}
      </section>

      <div className="border-t border-default my-6" />
    </>
  );
};

type Connection = {
  id: string;
  email: string;
  connectedAt: string;
  needsReconnect: boolean;
};

const ConnectionRow = ({ connection }: { connection: Connection }) => {
  const utils = trpc.useUtils();
  const disconnect = trpc.calendarConnections.disconnect.useMutation({
    onSuccess: () => utils.calendarConnections.list.invalidate(),
  });

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-size-sm font-semibold text-primary break-words">{connection.email}</p>
        <p className="text-size-xs text-secondary">
          Google Calendar · Connected {formatDate(connection.connectedAt)}
        </p>
        {connection.needsReconnect && (
          <p className="text-size-xs text-warning-fg">
            We can't read this calendar any more. Disconnect it, then connect it again.
          </p>
        )}
        {disconnect.error && <p className="text-size-xs text-error-fg" role="alert">{disconnect.error.message}</p>}
      </div>
      <Button
        variant="secondary"
        tone="destructive"
        size="small"
        className="shrink-0"
        loading={disconnect.isPending}
        onClick={() => disconnect.mutate({ id: connection.id })}
        aria-label={`Disconnect ${connection.email}`}
      >
        Disconnect
      </Button>
    </li>
  );
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default CalendarConnectionsSection;
