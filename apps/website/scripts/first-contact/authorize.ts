/* eslint-disable no-console */

// One-off setup for First Contact: sign in as the dewi-bots@bluedot.org bot account, create the "First Contact"
// calendar, and save the refresh token and calendar ID to apps/website/.env.local (which git ignores).
//
//   cd apps/website && npx tsx scripts/first-contact/authorize.ts
//
// Uses the Calendar Connect OAuth client (GOOGLE_CALENDAR_CLIENT_ID/SECRET in .env.local) and its registered
// http://localhost:8000/api/welcome/google/callback redirect URI, so stop any dev server on port 8000 first.
// If WELCOME_GOOGLE_CALENDAR_ID is already set, it keeps that calendar instead of making a new one.
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const SCOPES = [
  // Create the First Contact calendar and manage events on it, and nothing else
  'https://www.googleapis.com/auth/calendar.app.created',
  // See when colleagues are busy, without seeing their events
  'https://www.googleapis.com/auth/calendar.freebusy',
];
const PORT = 8000;
const REDIRECT_URI = `http://localhost:${PORT}/api/welcome/google/callback`;
const ENV_PATH = path.join(import.meta.dirname, '../../.env.local');

const env = Object.fromEntries(readFileSync(ENV_PATH, 'utf8').split('\n')
  .map((line) => /^([A-Z0-9_]+)=(.*)$/.exec(line.trim()))
  .filter((match) => match !== null)
  .map((match) => [match[1]!, match[2]!.trim()]));

const clientId = env.GOOGLE_CALENDAR_CLIENT_ID;
const clientSecret = env.GOOGLE_CALENDAR_CLIENT_SECRET;
if (!clientId || !clientSecret) throw new Error('Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET in apps/website/.env.local first');

const code = await new Promise<string>((resolve, reject) => {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', REDIRECT_URI);
    const received = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (!received && !error) {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/plain' }).end(error ? `Failed: ${error}` : 'Done. You can close this tab.');
    server.close();
    if (error) reject(new Error(`Google sign-in failed: ${error}`));
    else resolve(received!);
  });
  server.on('error', reject);
  server.listen(PORT, 'localhost', () => {
    const consent = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    consent.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      login_hint: 'dewi-bots@bluedot.org',
    }).toString();
    console.log(`Open this URL and sign in as dewi-bots@bluedot.org:\n\n${consent}\n`);
  });
});

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code',
  }),
});
const tokens = await tokenResponse.json() as { access_token?: string; refresh_token?: string; scope?: string; error?: string };
if (!tokens.access_token || !tokens.refresh_token) throw new Error(`Google token exchange failed: ${JSON.stringify(tokens)}`);
for (const scope of SCOPES) {
  if (!tokens.scope?.split(' ').includes(scope)) throw new Error(`Google didn't grant ${scope}. Tick every box on the consent screen.`);
}

const google = (pathname: string, body: unknown) => fetch(`https://www.googleapis.com/calendar/v3${pathname}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

let calendarId = env.WELCOME_GOOGLE_CALENDAR_ID;
if (!calendarId) {
  const created = await google('/calendars', {
    summary: 'First Contact',
    description: 'Chats between new BlueDot hires and teammates, booked from bluedot.org/welcome.',
    timeZone: 'America/Los_Angeles',
  });
  const calendar = await created.json() as { id?: string };
  if (!calendar.id) throw new Error(`Couldn't create the calendar: HTTP ${created.status} ${JSON.stringify(calendar)}`);
  calendarId = calendar.id;
}

// The bot has to see staff free/busy times; check it can with a known Workspace calendar
const probe = await google('/freeBusy', {
  timeMin: new Date().toISOString(), timeMax: new Date(Date.now() + 60 * 60 * 1000).toISOString(), items: [{ id: 'dewi@bluedot.org' }],
});
const probeBody = await probe.json() as { calendars?: Record<string, { errors?: unknown[] }> };
const canSeeStaff = probe.ok && !probeBody.calendars?.['dewi@bluedot.org']?.errors?.length;

let file = readFileSync(ENV_PATH, 'utf8');
for (const [name, value] of [['WELCOME_GOOGLE_REFRESH_TOKEN', tokens.refresh_token], ['WELCOME_GOOGLE_CALENDAR_ID', calendarId]] as const) {
  file = new RegExp(`^${name}=.*$`, 'm').test(file) ? file.replace(new RegExp(`^${name}=.*$`, 'm'), `${name}=${value}`) : `${file.trimEnd()}\n${name}=${value}\n`;
}

writeFileSync(ENV_PATH, file);
console.log(`Saved WELCOME_GOOGLE_REFRESH_TOKEN and WELCOME_GOOGLE_CALENDAR_ID to apps/website/.env.local.
Calendar ID: ${calendarId}
Can see staff free/busy: ${canSeeStaff ? 'yes' : 'NO, check dewi-bots is a bluedot.org Workspace account'}`);
