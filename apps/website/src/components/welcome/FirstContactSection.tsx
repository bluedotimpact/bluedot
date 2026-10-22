import {
  Button, Callout, H1, Input, P, ProgressDots,
} from '@bluedot/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { z } from 'zod';

type Chat = { name: string; start: string };
type PageQuery = { chats: Chat[] | null; missing: number; errorCode: string | null };

// Matches WelcomeError in pages/api/welcome/google/callback.ts
const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  cancelled: {
    title: 'No calls booked',
    body: 'You cancelled on the Google screen. Try again when you\'re ready.',
  },
  missing_scope: {
    title: 'We need to see when you\'re busy',
    body: 'On the Google screen, tick the box that lets us see your availability. Then try again.',
  },
  expired: {
    title: 'That took too long',
    body: 'Please try again.',
  },
  failed: {
    title: 'Something went wrong',
    body: 'Please try again. If it still doesn\'t work, tell your hiring manager.',
  },
};

const chatsSchema = z.array(z.object({ name: z.string(), start: z.string() }));

const FirstContactSection = () => {
  const router = useRouter();
  // Read once, then cleared from the address bar so a refresh or a shared link doesn't show stale results
  const [query, setQuery] = useState<PageQuery | null>(null);

  useEffect(() => {
    if (!router.isReady || query) return;
    setQuery(parseQuery(router.query));
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [router.isReady, router.query, query]);

  if (!query) return <ProgressDots className="py-8" />;
  if (query.chats) return <BookedChats chats={query.chats} missing={query.missing} />;
  return <ConnectForm errorCode={query.errorCode} />;
};

export default FirstContactSection;

const ConnectForm = ({ errorCode }: { errorCode: string | null }) => {
  const [password, setPassword] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const error = errorCode ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.failed! : null;

  const connect = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsStarting(true);
    setStartError(null);
    try {
      const response = await fetch('/api/welcome/google/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      const body = await response.json().catch(() => ({})) as { authUrl?: string; error?: string };
      if (!response.ok || !body.authUrl) throw new Error(body.error ?? 'Something went wrong. Please try again.');
      window.location.assign(body.authUrl);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-prose">
      <H1>Welcome to BlueDot!</H1>
      <P>
        Meet five of your new teammates before you start. Connect your Google Calendar, and we'll book five
        30-minute video calls in the next two weeks, at times you're free.
      </P>
      <P className="text-secondary text-size-sm">
        We only see when you're busy, not what your events are. We don't keep access.
      </P>
      {error && <Callout tone="error" title={error.title} role="alert">{error.body}</Callout>}
      <form onSubmit={connect} className="flex flex-col items-start gap-3">
        <label htmlFor="welcome-password" className="text-size-sm font-medium text-primary">Password (from your welcome email)</label>
        <Input
          id="welcome-password"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="max-w-[320px]"
          aria-invalid={!!startError}
          required
        />
        <Button type="submit" loading={isStarting} aria-label="Connect Google Calendar">
          Connect Google Calendar
        </Button>
        {startError && <p className="text-size-sm text-error-fg" role="alert">{startError}</p>}
      </form>
      <P className="text-secondary text-size-xs">
        Not on Google Calendar? Tell your hiring manager, and they'll set up your calls.
      </P>
    </div>
  );
};

const BookedChats = ({ chats, missing }: { chats: Chat[]; missing: number }) => (
  <div className="flex flex-col gap-4 max-w-prose">
    <H1>You're all set!</H1>
    <P>We've added these calls to your calendar:</P>
    <ul className="bluedot-p list-disc pl-6 flex flex-col gap-2" aria-label="Your calls">
      {chats.map((chat) => (
        <li key={`${chat.name}-${chat.start}`}>
          <strong>{chat.name}</strong>
          {': '}
          {formatChatTime(chat.start)}
        </li>
      ))}
    </ul>
    {missing > 0 && (
      <P>
        We couldn't find a time for {missing === 1 ? 'one more call' : `${missing} more calls`}. Someone from the team
        will set {missing === 1 ? 'it' : 'them'} up with you.
      </P>
    )}
    <P>Need a different time? Move the invite in your calendar.</P>
  </div>
);

function parseQuery(query: Record<string, string | string[] | undefined>): PageQuery {
  const errorCode = typeof query.error === 'string' ? query.error : null;
  let chats: Chat[] | null = null;
  if (typeof query.chats === 'string') {
    try {
      chats = chatsSchema.parse(JSON.parse(query.chats));
    } catch {
      chats = null;
    }
  }

  const missing = typeof query.missing === 'string' ? Math.max(0, parseInt(query.missing, 10) || 0) : 0;
  return { chats, missing, errorCode };
}

function formatChatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}
