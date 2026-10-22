import type { NextApiRequest, NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { GOOGLE_FREEBUSY_SCOPE } from '../../../../lib/api/calendarConnect';
import callbackHandler from './callback';
import startHandler from './start';

const TEST_ENV = vi.hoisted(() => ({
  APP_NAME: 'website',
  PG_URL: 'postgresql://fake',
  AIRTABLE_PERSONAL_ACCESS_TOKEN: 'fake',
  ALERTS_SLACK_CHANNEL_ID: 'C',
  CLIENT_ERRORS_SLACK_CHANNEL_ID: 'C',
  ALERTS_SLACK_BOT_TOKEN: 'fake',
  KEYCLOAK_CLIENT_ID: 'fake',
  KEYCLOAK_CLIENT_SECRET: 'fake',
  GOOGLE_CALENDAR_CLIENT_ID: 'test-client-id',
  GOOGLE_CALENDAR_CLIENT_SECRET: 'test-client-secret',
  CALENDAR_CONNECT_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
  WELCOME_PASSWORD: 'Carl Sagan',
  WELCOME_SLACK_BOT_TOKEN: 'xoxb-first-contact',
  WELCOME_SLACK_CHANNEL_ID: 'C-WELCOME',
  WELCOME_GOOGLE_REFRESH_TOKEN: 'bot-refresh',
  WELCOME_GOOGLE_CALENDAR_ID: 'first-contact@group.calendar.google.com',
  VITEST: 'true',
}));

vi.mock('../../../../lib/api/env', () => ({ default: TEST_ENV }));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...await importOriginal<object>(), slackAlert: vi.fn() }));
vi.mock('../../../../lib/api/makeApiRoute', async () => {
  const { makeMakeApiRoute } = await import('@bluedot/ui/src/api');
  const verifyAndDecodeToken = () => {
    throw new Error('no auth in these tests');
  };

  return { makeApiRoute: makeMakeApiRoute({ env: TEST_ENV, verifyAndDecodeToken }) };
});

const CALENDAR_EVENTS = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(TEST_ENV.WELCOME_GOOGLE_CALENDAR_ID)}/events`;

type FakeEvent = { id: string; status?: string; summary: string; description: string; start: { dateTime: string }; attendees: { email: string }[]; extendedProperties: { private: Record<string, string> } };

const SLACK_USERS: Record<string, unknown> = {
  U1: {
    id: 'U1', real_name: 'Alex Groth', tz: 'America/Los_Angeles', profile: { email: 'alex@bluedot.org', real_name: 'Alex Groth' },
  },
  U2: {
    id: 'U2', real_name: 'Bilal Chughtai', tz: 'Europe/London', profile: { email: 'bilal@bluedot.org', real_name: 'Bilal Chughtai' },
  },
  U3: {
    id: 'U3', real_name: 'Li-Lian Ang', tz: 'America/Los_Angeles', profile: { email: 'lilian@bluedot.org', real_name: 'Li-Lian Ang' },
  },
  U4: {
    id: 'U4', real_name: 'Nixon Hanna', tz: 'America/New_York', profile: { email: 'nixon@bluedot.org', real_name: 'Nixon Hanna' },
  },
  U5: {
    id: 'U5', real_name: 'Cosima Axford', tz: 'Europe/London', profile: { email: 'cosima@bluedot.org', real_name: 'Cosima Axford' },
  },
  // The hire, already in Slack under their new BlueDot email
  UHIRE: {
    id: 'UHIRE', real_name: 'Caitlin Mah', tz: 'America/Toronto', profile: { email: 'caitlin@bluedot.org', real_name: 'Caitlin Mah' },
  },
  U6: {
    id: 'U6', real_name: 'Will Saunter', tz: 'America/Los_Angeles', profile: { email: 'will@bluedot.org', real_name: 'Will Saunter' },
  },
  UBOT: { id: 'UBOT', is_bot: true, profile: { email: 'bot@bluedot.org' } },
  UGRANTEE: {
    id: 'UGRANTEE', real_name: 'Grantee', tz: 'Europe/Berlin', profile: { email: 'someone@gmail.com' },
  },
  UGONE: { id: 'UGONE', deleted: true, profile: { email: 'gone@bluedot.org' } },
};

let events: FakeEvent[];
let slackPosts: { channel: string; text: string }[];
let revoked: string[];
let hireScope: string;
let failSlackPost: boolean;
let slackMemberLookups: number;
let channelMembers: string[];

const unsignedJwt = (claims: Record<string, unknown>) => [
  Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url'),
  Buffer.from(JSON.stringify(claims)).toString('base64url'),
  'signature',
].join('.');

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

async function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const auth = new Headers(init?.headers).get('Authorization');

  if (url.href === 'https://oauth2.googleapis.com/token') {
    const form = new URLSearchParams(init?.body as string);
    if (form.get('grant_type') === 'authorization_code') {
      if (form.get('code') !== 'hire-code') return json(400, { error: 'invalid_grant' });
      expect(form.get('redirect_uri')).toBe('https://bluedot.org/api/welcome/google/callback');
      return json(200, {
        access_token: 'hire-access',
        scope: hireScope,
        id_token: unsignedJwt({
          iss: 'https://accounts.google.com', aud: 'test-client-id', sub: 'g-caitlin', email: 'Caitlin.Mah@example.com', name: 'Caitlin Mah',
        }),
      });
    }

    expect(form.get('refresh_token')).toBe('bot-refresh');
    return json(200, { access_token: 'bot-access' });
  }

  if (url.href === 'https://oauth2.googleapis.com/revoke') {
    revoked.push(new URLSearchParams(init?.body as string).get('token')!);
    return new Response('', { status: 200 });
  }

  if (url.href === 'https://www.googleapis.com/calendar/v3/freeBusy') {
    const body = JSON.parse(init?.body as string) as { items: { id: string }[] };
    if (auth === 'Bearer hire-access') {
      expect(body.items).toEqual([{ id: 'primary' }]);
      return json(200, { calendars: { primary: { busy: [] } } });
    }

    expect(auth).toBe('Bearer bot-access');
    return json(200, {
      calendars: Object.fromEntries(body.items.map(({ id }) => [id, id === 'will@bluedot.org' ? { errors: [{ reason: 'notFound' }] } : { busy: [] }])),
    });
  }

  if (url.origin + url.pathname === CALENDAR_EVENTS) {
    expect(auth).toBe('Bearer bot-access');
    if (init?.method === 'POST') {
      const event = JSON.parse(init.body as string) as FakeEvent;
      // Like Google, cancelled events keep their IDs
      if (events.some((e) => e.id === event.id)) return json(409, { error: { message: 'duplicate' } });
      events.push({ ...event, status: 'confirmed' });
      return json(200, event);
    }

    return json(200, { items: events.filter((e) => e.status !== 'cancelled') });
  }

  if (url.pathname.startsWith(new URL(CALENDAR_EVENTS).pathname)) {
    const event = events.find((e) => e.id === url.pathname.split('/').pop());
    if (!event) return json(404, { error: { message: 'not found' } });
    if (init?.method === 'PATCH') Object.assign(event, JSON.parse(init.body as string));
    return json(200, event);
  }

  if (url.origin === 'https://slack.com') {
    expect(auth).toBe('Bearer xoxb-first-contact');
    const method = url.pathname.replace('/api/', '');
    if (method === 'conversations.members') {
      slackMemberLookups += 1;
      expect(url.searchParams.get('channel')).toBe('C-WELCOME');
      return json(200, { ok: true, members: channelMembers });
    }

    if (method === 'users.info') return json(200, { ok: true, user: SLACK_USERS[url.searchParams.get('user')!] });
    if (method === 'chat.postMessage') {
      if (failSlackPost) return json(200, { ok: false, error: 'not_in_channel' });
      slackPosts.push(JSON.parse(init?.body as string) as { channel: string; text: string });
      return json(200, { ok: true });
    }
  }

  throw new Error(`Unexpected fetch: ${init?.method ?? 'GET'} ${url.href}`);
}

beforeEach(() => {
  // Monday 19 Oct 2026, 08:00 in SF
  vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  events = [];
  slackPosts = [];
  revoked = [];
  hireScope = `openid email profile ${GOOGLE_FREEBUSY_SCOPE}`;
  failSlackPost = false;
  slackMemberLookups = 0;
  channelMembers = Object.keys(SLACK_USERS);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

type MockRes = { statusCode: number; body: unknown; redirectedTo: string | null; headers: Record<string, string> };

const mockRes = () => ({
  statusCode: 0,
  body: undefined as unknown,
  redirectedTo: null as string | null,
  headers: {} as Record<string, string>,
  status(code: number) {
    this.statusCode = code;
    return this;
  },
  json(payload: unknown) {
    this.body = payload;
    return this;
  },
  end() {
    return this;
  },
  setHeader(name: string, value: string) {
    this.headers[name] = value;
  },
  redirect(code: number, url: string) {
    this.statusCode = code;
    this.redirectedTo = url;
  },
});

let ipCounter = 0;
const start = async (body: unknown, ip = `10.0.0.${ipCounter += 1}`) => {
  const res = mockRes();
  await startHandler({
    method: 'POST', headers: { 'x-forwarded-for': ip }, body, url: '/api/welcome/google/start',
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return res as MockRes;
};

const callback = async ({ query, cookie }: { query: Record<string, string>; cookie?: string }) => {
  const res = mockRes();
  await callbackHandler({
    method: 'GET', query, cookies: cookie ? { welcome_state: cookie } : {}, headers: {},
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return res as MockRes;
};

const startFlow = async () => {
  const res = await start({ password: 'carlsagan', timeZone: 'America/Toronto' });
  expect(res.statusCode).toBe(200);
  const authUrl = new URL((res.body as { authUrl: string }).authUrl);
  const cookie = /welcome_state=([^;]+)/.exec(res.headers['Set-Cookie']!)![1]!;
  return { authUrl, state: authUrl.searchParams.get('state')!, cookie };
};

const resultFrom = (redirectedTo: string | null) => {
  const url = new URL(redirectedTo!, 'https://bluedot.org');
  expect(url.pathname).toBe('/welcome');
  return {
    chats: url.searchParams.get('chats') ? JSON.parse(url.searchParams.get('chats')!) as { name: string; start: string }[] : null,
    missing: url.searchParams.get('missing'),
    error: url.searchParams.get('error'),
  };
};

describe('start', () => {
  test('asks Google once for free/busy, name and email, without a refresh token', async () => {
    const { authUrl } = await startFlow();
    expect(Object.fromEntries(authUrl.searchParams)).toMatchObject({
      client_id: 'test-client-id',
      redirect_uri: 'https://bluedot.org/api/welcome/google/callback',
      scope: `openid email profile ${GOOGLE_FREEBUSY_SCOPE}`,
      access_type: 'online',
    });
  });

  test('rejects a wrong password, then stops trying after ten attempts', async () => {
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect((await start({ password: 'pale blue dot' }, '10.9.9.9')).statusCode).toBe(401);
    }

    expect((await start({ password: 'carlsagan' }, '10.9.9.9')).statusCode).toBe(429);
  });

  test('accepts the password with any case or spacing', async () => {
    expect((await start({ password: '  CARL sagan ' })).statusCode).toBe(200);
  });
});

describe('callback', () => {
  test('books five chats, posts in #welcome, forgets the token and shows who they are meeting', async () => {
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state }, cookie });

    const result = resultFrom(res.redirectedTo);
    expect(result.error).toBeNull();
    expect(result.missing).toBe('0');
    expect(result.chats).toHaveLength(5);

    expect(events).toHaveLength(5);
    const teammates = events.map((e) => e.extendedProperties.private.firstContactTeammate);
    // Not the hire themselves, the bot, the grantee, the deactivated account, or Will, whose calendar Google won't share
    expect(new Set(teammates)).toEqual(new Set(['alex@bluedot.org', 'bilal@bluedot.org', 'lilian@bluedot.org', 'nixon@bluedot.org', 'cosima@bluedot.org']));
    for (const event of events) {
      expect(event.attendees[0]).toEqual({ email: 'caitlin.mah@example.com' });
      expect(event.summary).toMatch(/^First Contact: Caitlin Mah × /);
      expect(event.description).toContain('Welcome to BlueDot, Caitlin!');
    }

    expect(revoked).toEqual(['hire-access']);
    expect(slackPosts).toHaveLength(1);
    expect(slackPosts[0]!.channel).toBe('C-WELCOME');
    expect(slackPosts[0]!.text).toContain('*Welcome, Caitlin Mah!*');
    expect(slackPosts[0]!.text.match(/<@U\d>/g)).toHaveLength(5);
  });

  test('never pairs the hire with their own BlueDot Slack account', async () => {
    channelMembers = ['U1', 'U2', 'U3', 'UHIRE'];
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state }, cookie });

    expect(resultFrom(res.redirectedTo).missing).toBe('2');
    expect(events.map((e) => e.extendedProperties.private.firstContactTeammate)).not.toContain('caitlin@bluedot.org');
    expect(slackPosts[0]!.text).toContain('Couldn\'t find a time for 2 more calls');
  });

  test('a second visit shows the same chats and books nothing new', async () => {
    const first = await startFlow();
    await callback({ query: { code: 'hire-code', state: first.state }, cookie: first.cookie });
    const second = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state: second.state }, cookie: second.cookie });

    expect(resultFrom(res.redirectedTo).chats).toHaveLength(5);
    expect(events).toHaveLength(5);
    expect(slackPosts).toHaveLength(1);
    expect(slackMemberLookups).toBe(1);
  });

  test('books a pair again after their earlier chat was cancelled', async () => {
    const first = await startFlow();
    await callback({ query: { code: 'hire-code', state: first.state }, cookie: first.cookie });
    for (const event of events) event.status = 'cancelled';

    const second = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state: second.state }, cookie: second.cookie });

    expect(resultFrom(res.redirectedTo).chats).toHaveLength(5);
    expect(events.filter((e) => e.status === 'confirmed')).toHaveLength(5);
  });

  test('still shows the chats if posting in #welcome fails', async () => {
    failSlackPost = true;
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state }, cookie });
    expect(resultFrom(res.redirectedTo).chats).toHaveLength(5);
  });

  test('asks them to try again if they untick the calendar permission', async () => {
    hireScope = 'openid email profile';
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state }, cookie });
    expect(resultFrom(res.redirectedTo).error).toBe('missing_scope');
    expect(events).toHaveLength(0);
  });

  test('says they cancelled when they back out on the Google screen', async () => {
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { error: 'access_denied', state }, cookie });
    expect(resultFrom(res.redirectedTo).error).toBe('cancelled');
  });

  test('refuses a callback from a different browser', async () => {
    const { state } = await startFlow();
    const res = await callback({ query: { code: 'hire-code', state }, cookie: 'someone-else' });
    expect(resultFrom(res.redirectedTo).error).toBe('failed');
    expect(events).toHaveLength(0);
  });
});
