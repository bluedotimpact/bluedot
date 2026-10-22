import { Button, H2, P } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

/**
 * Lets people who can't connect their calendar still be paired for 1-1 chats. Hidden when they have a working
 * calendar, unless it's already on, so they can still turn it off.
 */
const PairWithoutCalendarSection = ({ connectToken, hasWorkingCalendar }: { connectToken: string | null; hasWorkingCalendar: boolean }) => {
  const utils = trpc.useUtils();
  const status = trpc.calendarConnections.pairWithoutCalendarStatus.useQuery();
  const onSuccess = () => utils.calendarConnections.pairWithoutCalendarStatus.invalidate();
  const turnOn = trpc.calendarConnections.pairWithoutCalendar.useMutation({ onSuccess });
  const stop = trpc.calendarConnections.stopPairWithoutCalendar.useMutation({ onSuccess });

  if (!status.data) return null;
  const { on } = status.data;
  if (!on && hasWorkingCalendar) return null;

  const error = turnOn.error ?? stop.error;

  return (
    <section className="mt-4 flex flex-col items-start gap-3 border-t border-subtle pt-6">
      <H2 className="text-size-md">Can't connect your calendar?</H2>
      {on ? (
        <>
          <div role="status">
            <P>
              <strong>You'll be paired without a calendar.</strong>{' '}
              {hasWorkingCalendar
                ? 'You\'ve also connected a calendar, so we\'ll use that to find times you\'re free.'
                : 'We\'ll pick a daytime slot in your time zone, and you can move the invite if it clashes.'}
            </P>
          </div>
          <Button variant="secondary" loading={stop.isPending} onClick={() => stop.mutate()}>
            Stop
          </Button>
        </>
      ) : (
        <>
          <P>
            If you use Proton, Apple or another calendar we can't connect yet, we can still pair you. We'll pick a daytime
            slot in your time zone, and you can move the invite if it clashes.
          </P>
          <Button variant="secondary" loading={turnOn.isPending} onClick={() => turnOn.mutate({ token: connectToken })}>
            Pair me without a calendar
          </Button>
        </>
      )}
      {error && <p className="text-size-sm text-error-fg" role="alert">{error.message}</p>}
    </section>
  );
};

export default PairWithoutCalendarSection;
