import { Button } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

export type CalendarConnectionSummary = {
  id: string;
  email: string;
  connectedAt: string;
  needsReconnect: boolean;
};

/** The person's connected calendars, each with Disconnect. Used on /account and /account/calendars. */
const CalendarConnectionList = ({ connections }: { connections: CalendarConnectionSummary[] }) => (
  <ul className="flex flex-col divide-y divide-default rounded-surface border border-default" aria-label="Connected calendars">
    {connections.map((connection) => (
      <ConnectionRow key={connection.id} connection={connection} />
    ))}
  </ul>
);

const ConnectionRow = ({ connection }: { connection: CalendarConnectionSummary }) => {
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

export default CalendarConnectionList;
