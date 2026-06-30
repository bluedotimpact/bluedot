// Server-side Notion helpers for the "Add to Top Talent CRM" browser extension.
// Ported from the extension's old client-side notion.js — the Notion token now
// lives only here (env.NOTION_API_TOKEN), never on a teammate's machine.

import createHttpError from 'http-errors';
import env from './env';

const NOTION_VERSION = '2022-06-28';
const NOTION_BASE = 'https://api.notion.com/v1';

// The Top Talent CRM database. The id from the database URL works as
// parent.database_id under Notion-Version 2022-06-28.
export const CRM_DATABASE_ID = '343f8e6903538022acfaf81252fed117';

// The five CASE score properties (1-5). Keys must match the Notion column names.
export const SCORE_KEYS = ['Expertise', 'Agency', 'Sharpness', 'Commitment', 'Strategic clarity'] as const;
export type ScoreKey = typeof SCORE_KEYS[number];
export type Scores = Partial<Record<ScoreKey, number>>;

// Only BlueDot staff (bluedot.org emails) may use the CRM extension. The customers
// Keycloak realm also contains course participants, so realm membership alone is
// not enough — gate on the email domain.
export function assertBluedotStaff(email: string): void {
  if (!email.toLowerCase().endsWith('@bluedot.org')) {
    throw new createHttpError.Forbidden('Top Talent CRM is restricted to BlueDot staff.');
  }
}

export function getNotionToken(): string {
  if (!env.NOTION_API_TOKEN) {
    throw new createHttpError.InternalServerError('NOTION_API_TOKEN is not configured.');
  }

  return env.NOTION_API_TOKEN;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

// Turn a non-2xx Notion response into a thrown HTTP error with a useful message.
// 404 from Notion usually means the integration can't see the DB (not shared).
async function ensureOk(resp: Response, context: string): Promise<void> {
  if (resp.ok) return;
  let detail = `HTTP ${resp.status}`;
  try {
    const data = await resp.json() as { message?: string; code?: string };
    detail = data.message ?? data.code ?? detail;
  } catch { /* keep HTTP status */ }

  throw new createHttpError.BadGateway(`Notion ${context} failed: ${detail}`);
}

// A date string the client computed in the user's local timezone (YYYY-MM-DD).
// Falls back to the server's date if absent/malformed (server runs in UTC).
function resolveLocalDate(localDate?: string): string {
  if (localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) return localDate;
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Score properties payload — only the fields that have a numeric value.
function scoreProperties(scores?: Scores): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const key of SCORE_KEYS) {
    const v = scores?.[key];
    if (typeof v === 'number' && !Number.isNaN(v)) props[key] = { number: v };
  }

  return props;
}

// A bullet starting with an @today date mention (renders "Today", then
// "Yesterday"/etc. as time passes). With a note: "@today: <note>".
// Without: "Added @today via LinkedIn".
function noteBullet(notes: string | undefined, localDate: string) {
  const todayMention = { type: 'mention', mention: { type: 'date', date: { start: localDate } } };
  const trimmed = (notes ?? '').trim();
  const richText = trimmed
    ? [todayMention, { type: 'text', text: { content: `: ${trimmed}` } }]
    : [{ type: 'text', text: { content: 'Added ' } }, todayMention, { type: 'text', text: { content: ' via LinkedIn' } }];
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText } };
}

// Existing note bullets on a page, in order: [{ id, rich_text }].
async function getNoteBullets(token: string, pageId: string): Promise<{ id: string; rich_text: unknown[] }[]> {
  const notes: { id: string; rich_text: unknown[] }[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(`${NOTION_BASE}/blocks/${pageId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(url.toString(), { headers: headers(token) });
    // eslint-disable-next-line no-await-in-loop
    await ensureOk(resp, 'list note blocks');
    // eslint-disable-next-line no-await-in-loop
    const data = await resp.json() as { results?: NotionBlock[]; has_more?: boolean; next_cursor?: string };
    for (const b of data.results ?? []) {
      if (b.type === 'bulleted_list_item') notes.push({ id: b.id, rich_text: b.bulleted_list_item?.rich_text ?? [] });
    }

    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return notes;
}

type NotionBlock = { id: string; type?: string; bulleted_list_item?: { rich_text?: unknown[] } };

type NotionPage = {
  id: string;
  url: string;
  properties?: {
    Name?: { title?: { plain_text?: string }[] };
    Status?: { status?: { name?: string } };
    [key: string]: { number?: number } | unknown;
  };
};

type NotionUser = { id: string; type?: string; name?: string; person?: { email?: string } };

export type CrmMatch = {
  id: string;
  url: string;
  name: string;
  status: string | null;
  scores: Scores;
};

// Find an existing CRM row by exact LinkedIn URL. Returns the first match or null,
// including its current status + scores so the panel can pre-fill them for editing.
export async function findByLinkedIn(token: string, linkedInUrl: string): Promise<CrmMatch | null> {
  const resp = await fetch(`${NOTION_BASE}/databases/${CRM_DATABASE_ID}/query`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      filter: { property: 'LinkedIn', url: { equals: linkedInUrl } },
      page_size: 1,
    }),
  });
  await ensureOk(resp, 'query');
  const data = await resp.json() as { results?: NotionPage[] };
  const page = data.results?.[0];
  if (!page) return null;
  const props = page.properties ?? {};
  const scores: Scores = {};
  for (const key of SCORE_KEYS) {
    const n = (props[key] as { number?: number } | undefined)?.number;
    if (typeof n === 'number') scores[key] = n;
  }

  return {
    id: page.id,
    url: page.url,
    name: props.Name?.title?.[0]?.plain_text ?? '(untitled)',
    status: props.Status?.status?.name ?? null,
    scores,
  };
}

// Match a BlueDot staff email to a Notion workspace member, so the new row's
// Owner is set automatically from the signed-in user (no manual owner-picker).
// Returns the Notion user id, or null if no person with that email is found.
// Requires the integration to have "Read user information including email addresses".
export async function resolveOwnerByEmail(token: string, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let cursor: string | undefined;
  do {
    const url = new URL(`${NOTION_BASE}/users`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(url.toString(), { headers: headers(token) });
    // eslint-disable-next-line no-await-in-loop
    await ensureOk(resp, 'list users');
    // eslint-disable-next-line no-await-in-loop
    const data = await resp.json() as { results?: NotionUser[]; has_more?: boolean; next_cursor?: string };
    const found = (data.results ?? []).find((u) => u.type === 'person' && u.person?.email?.toLowerCase() === target);
    if (found) return found.id;
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return null;
}

export type CreatePersonInput = {
  name: string;
  linkedInUrl: string;
  status?: string;
  scores?: Scores;
  notes?: string;
  localDate?: string;
  /** Resolved server-side from the signed-in user's email. */
  ownerUserId?: string | null;
};

export type CreatedPerson = { id: string; url: string };

// Create a new CRM row, owned by the signed-in user.
export async function createPerson(token: string, input: CreatePersonInput): Promise<CreatedPerson> {
  const {
    name, linkedInUrl, status, scores, notes, ownerUserId, localDate,
  } = input;

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: name ?? '(unnamed)' } }] },
    ...scoreProperties(scores),
  };
  if (linkedInUrl) properties.LinkedIn = { url: linkedInUrl };
  if (status) properties.Status = { status: { name: status } };
  if (ownerUserId) properties.Owner = { people: [{ object: 'user', id: ownerUserId }] };

  const resp = await fetch(`${NOTION_BASE}/pages`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      parent: { database_id: CRM_DATABASE_ID },
      properties,
      children: [noteBullet(notes, resolveLocalDate(localDate))],
    }),
  });
  await ensureOk(resp, 'create page');
  const data = await resp.json() as CreatedPerson;
  return { id: data.id, url: data.url };
}

export type UpdatePersonInput = {
  status?: string;
  scores?: Scores;
  notes?: string;
  localDate?: string;
};

// Update an existing CRM row: status + scores, and (if a note is given) prepend
// a new dated bullet above the existing notes.
export async function updatePerson(token: string, pageId: string, input: UpdatePersonInput): Promise<{ id: string }> {
  const { status, scores, notes } = input;

  // 1. Properties (status + any set scores).
  const properties: Record<string, unknown> = { ...scoreProperties(scores) };
  if (status) properties.Status = { status: { name: status } };
  if (Object.keys(properties).length) {
    const resp = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ properties }),
    });
    await ensureOk(resp, 'update properties');
  }

  // 2. New note, prepended. Notion can't insert before a block, so re-append the
  //    existing note bullets after the new one, then delete the originals.
  const trimmed = (notes ?? '').trim();
  if (trimmed) {
    const old = await getNoteBullets(token, pageId);
    const children = [
      noteBullet(trimmed, resolveLocalDate(input.localDate)),
      ...old.map((n) => ({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: n.rich_text } })),
    ];
    const appendResp = await fetch(`${NOTION_BASE}/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ children }),
    });
    await ensureOk(appendResp, 'append note');
    for (const n of old) {
      // eslint-disable-next-line no-await-in-loop
      await fetch(`${NOTION_BASE}/blocks/${n.id}`, { method: 'DELETE', headers: headers(token) });
    }
  }

  return { id: pageId };
}
