import {
  A, Breadcrumbs, Button, Callout, H1, P, ProgressDots, Section, withAuth,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ROUTES } from '../../../lib/routes';
import { pageMetaTags } from '../../../lib/linkPreviewMetaTags';
import { startGoogleCalendarConnect } from '../../../lib/startCalendarConnect';
import { trpc } from '../../../utils/trpc';

const CURRENT_ROUTE = ROUTES.calendarConnect;

// Matches CalendarConnectError in pages/api/calendar-connections/google/callback.ts
const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  cancelled: {
    title: 'Your calendar wasn\'t connected',
    body: 'You cancelled on the Google screen. You can try again whenever you like.',
  },
  missing_scope: {
    title: 'We need permission to see when you\'re busy',
    body: 'On the Google screen, make sure the box to see your availability is ticked, then try again.',
  },
  expired: {
    title: 'That took too long',
    body: 'For security, connecting has to finish within 10 minutes. Please try again.',
  },
  failed: {
    title: 'Something went wrong',
    body: 'We couldn\'t connect your calendar. Please try again, or email us at team@bluedot.org if it keeps happening.',
  },
};

const CalendarConnectPage = withAuth(() => {
  const router = useRouter();
  // Read once: the token is then removed from the address bar so it doesn't end up in analytics or browser history
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [hasReadQuery, setHasReadQuery] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!router.isReady || hasReadQuery) return;
    setConnectToken(typeof router.query.s === 'string' ? router.query.s : null);
    setErrorCode(typeof router.query.error === 'string' ? router.query.error : null);
    setHasReadQuery(true);
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [router.isReady, router.query, hasReadQuery]);

  const linkCheck = trpc.calendarConnections.checkConnectLink.useQuery(
    { token: connectToken ?? '' },
    { enabled: hasReadQuery && connectToken !== null },
  );
  const connections = trpc.calendarConnections.list.useQuery(undefined, { enabled: hasReadQuery });

  const connect = async (token: string | null) => {
    setIsStarting(true);
    setStartError(null);
    try {
      await startGoogleCalendarConnect({ connectToken: token });
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
      setIsStarting(false);
    }
  };

  const renderContent = () => {
    if (!hasReadQuery || connections.isLoading || (connectToken !== null && linkCheck.isLoading)) {
      return <ProgressDots className="py-8" />;
    }

    const linkIsValid = linkCheck.data?.valid === true;
    const hasConnections = (connections.data?.length ?? 0) > 0;
    // A valid link carries the Slack member. Without one, reuse the member from an earlier connection.
    const canConnect = linkIsValid || hasConnections;
    const error = errorCode ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.failed : null;

    return (
      <>
        {error && <Callout tone="error" title={error.title} role="alert">{error.body}</Callout>}

        <P>
          Connect your Google Calendar so we can schedule your 1-1 chats at times you're free.
        </P>
        <ul className="bluedot-p list-disc pl-6 flex flex-col gap-2">
          <li>We only see when you're busy. We never see event names, details, guests or locations.</li>
          <li>You can connect more than one calendar, for example your work one and your personal one.</li>
          <li>You can disconnect at any time from your <A href={ROUTES.account.url}>account page</A>.</li>
        </ul>
        <P className="text-secondary text-size-xs">
          Read more in our <A href={ROUTES.privacyPolicy.url}>privacy policy</A>.
        </P>

        {connectToken !== null && !linkIsValid && (
          <Callout tone="warning" title="This link has expired">
            {hasConnections
              ? 'You can still add another calendar to the ones you already connected.'
              : 'Please use the latest link we sent you on Slack.'}
          </Callout>
        )}

        {connectToken === null && !hasConnections && (
          <Callout tone="info" title="Use the link from Slack">
            To connect your first calendar, open the link we sent you on Slack. It tells us which Slack account to
            schedule chats for.
          </Callout>
        )}

        {canConnect && (
          <div className="flex flex-col items-start gap-2">
            <Button
              variant="primary"
              loading={isStarting}
              onClick={() => connect(linkIsValid ? connectToken : null)}
              aria-label="Connect Google Calendar"
            >
              Connect Google Calendar
            </Button>
            {startError && <p className="text-size-sm text-error-fg" role="alert">{startError}</p>}
          </div>
        )}

        {hasConnections && (
          <P className="text-size-xs text-secondary">
            You've already connected {connections.data!.map((c) => c.email).join(', ')}.
            Manage your calendars on your <A href={ROUTES.account.url}>account page</A>.
          </P>
        )}
      </>
    );
  };

  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${CURRENT_ROUTE.title} | BlueDot Impact` })}
        <meta name="robots" content="noindex" />
      </Head>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="min-h-[50vh]">
        <div className="flex flex-col gap-4 max-w-prose">
          <H1 className="text-size-xl">Connect your calendar</H1>
          {renderContent()}
        </div>
      </Section>
    </div>
  );
});

export default CalendarConnectPage;
