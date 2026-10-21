import {
  A, Breadcrumbs, Button, Callout, H1, P, ProgressDots, Section, withAuth,
} from '@bluedot/ui';
import type { CalendarProvider } from '@bluedot/db';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CalendarConnectionList from '../../../components/settings/CalendarConnectionList';
import { ROUTES } from '../../../lib/routes';
import { pageMetaTags } from '../../../lib/linkPreviewMetaTags';
import { startCalendarConnect } from '../../../lib/startCalendarConnect';
import { trpc } from '../../../utils/trpc';

const CURRENT_ROUTE = ROUTES.calendars;

// Matches CalendarConnectError in lib/api/calendarConnectRoutes.ts
const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  cancelled: {
    title: 'Your calendar wasn\'t connected',
    body: 'You cancelled on the sign-in screen. You can try again whenever you like.',
  },
  missing_scope: {
    title: 'We need permission to see when you\'re busy',
    body: 'On the sign-in screen, make sure the box to see your availability is ticked, then try again.',
  },
  needs_admin: {
    title: 'Your organisation needs to approve BlueDot first',
    body: 'Your work or school account only allows apps your IT team has approved. You can ask them to approve BlueDot, or connect a personal calendar instead.',
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

const CalendarsPage = withAuth(() => {
  const router = useRouter();
  // Read once, then cleared from the address bar so the Slack link doesn't end up in analytics or browser history
  const [query, setQuery] = useState<{ connectToken: string | null; errorCode: string | null; justConnected: boolean } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startingProvider, setStartingProvider] = useState<CalendarProvider | null>(null);

  useEffect(() => {
    if (!router.isReady || query) return;
    setQuery({
      connectToken: typeof router.query.s === 'string' ? router.query.s : null,
      errorCode: typeof router.query.error === 'string' ? router.query.error : null,
      justConnected: router.query.calendar === 'connected',
    });
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [router.isReady, router.query, query]);

  const connectToken = query?.connectToken ?? null;
  const linkCheck = trpc.calendarConnections.checkConnectLink.useQuery(
    { token: connectToken ?? '' },
    { enabled: connectToken !== null },
  );
  const connections = trpc.calendarConnections.list.useQuery(undefined, { enabled: query !== null });
  const providers = trpc.calendarConnections.providers.useQuery();
  const outlookAvailable = providers.data?.microsoft === true;

  const connect = async (provider: CalendarProvider) => {
    setStartingProvider(provider);
    setStartError(null);
    try {
      await startCalendarConnect({ provider, connectToken: linkCheck.data?.valid ? connectToken : null });
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
      setStartingProvider(null);
    }
  };

  const renderContent = () => {
    if (!query || connections.isLoading || providers.isLoading || (connectToken !== null && linkCheck.isLoading)) {
      return <ProgressDots className="py-8" />;
    }

    const linkIsValid = linkCheck.data?.valid === true;
    const hasConnections = (connections.data?.length ?? 0) > 0;
    const error = query.errorCode ? ERROR_MESSAGES[query.errorCode] ?? ERROR_MESSAGES.failed : null;

    return (
      <>
        {query.justConnected && (
          <Callout tone="success" title="Calendar connected" role="status">
            We'll use it to find times you're free. If you have another calendar, like a work one, add that too.
          </Callout>
        )}
        {error && <Callout tone="error" title={error.title} role="alert">{error.body}</Callout>}
        {connectToken !== null && !linkIsValid && (
          <Callout tone="warning" title="This Slack link has expired">
            You can still connect your calendar here, or use the newest link we sent you in Slack.
          </Callout>
        )}

        <P>
          {outlookAvailable
            ? 'Connect your Google or Outlook calendar so we can schedule your 1-1 chats at times you\'re free.'
            : 'Connect your Google Calendar so we can schedule your 1-1 chats at times you\'re free.'}
        </P>
        <ul className="bluedot-p list-disc pl-6 flex flex-col gap-2">
          <li>We only see when you're busy. We never see event names, details, guests or locations.</li>
          <li>
            {outlookAvailable
              ? 'Your calendar can be on any Google or Microsoft account, work or personal. You can connect more than one.'
              : 'Your calendar can be on any Google account, work or personal. You can connect more than one.'}
          </li>
          <li>
            You can disconnect a calendar at any time on this page.
            {outlookAvailable && ' For Outlook, you can also remove BlueDot\'s access in your Microsoft account settings.'}
          </li>
        </ul>
        <P className="text-secondary text-size-xs">
          Read more in our <A href={ROUTES.privacyPolicy.url}>privacy policy</A>.
        </P>

        {hasConnections && <CalendarConnectionList connections={connections.data!} />}
        {connections.error && <p className="text-size-sm text-error-fg" role="alert">{connections.error.message}</p>}

        <div className="flex flex-col items-start gap-2">
          {outlookAvailable ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start">
              <Button
                variant={hasConnections ? 'secondary' : 'primary'}
                loading={startingProvider === 'google'}
                disabled={startingProvider === 'microsoft'}
                onClick={() => connect('google')}
                className="max-w-full whitespace-normal py-2 text-left"
              >
                {hasConnections ? 'Add a Google calendar' : 'Connect Google Calendar'}
              </Button>
              <div className="flex max-w-full flex-col items-start gap-2 sm:max-w-64">
                <Button
                  variant={hasConnections ? 'secondary' : 'primary'}
                  loading={startingProvider === 'microsoft'}
                  disabled={startingProvider === 'google'}
                  onClick={() => connect('microsoft')}
                  aria-describedby="outlook-consent-note"
                  className="max-w-full whitespace-normal py-2 text-left"
                >
                  {hasConnections ? 'Add an Outlook calendar' : 'Connect Outlook Calendar'}
                </Button>
                <p id="outlook-consent-note" className="text-size-xs text-secondary">
                  Microsoft's screen asks to read your calendar. We only ask it for the times you're busy.
                </p>
              </div>
            </div>
          ) : (
            <Button
              variant={hasConnections ? 'secondary' : 'primary'}
              loading={startingProvider === 'google'}
              onClick={() => connect('google')}
              aria-label={hasConnections ? 'Add another calendar' : 'Connect Google Calendar'}
              // The longer label is too wide for a 320px screen, so let it wrap
              className="max-w-full whitespace-normal py-2 text-left"
            >
              {hasConnections ? 'Add another calendar (e.g. your work one)' : 'Connect Google Calendar'}
            </Button>
          )}
          {startError && <p className="text-size-sm text-error-fg" role="alert">{startError}</p>}
        </div>

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
          <H1 className="text-size-xl">Your calendars</H1>
          {renderContent()}
        </div>
      </Section>
    </div>
  );
});

export default CalendarsPage;
