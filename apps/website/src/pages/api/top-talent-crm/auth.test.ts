import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { verifyKeycloakToken } from '@bluedot/ui/src/server/verifyToken';
import {
  findByLinkedIn, resolveOwnerByEmail, createPerson, updatePerson,
} from '../../../lib/api/topTalentCrm';
import checkDup from './check-dup';
import create from './create';
import update from './update';

vi.mock('@bluedot/ui/src/server/verifyToken', () => ({ verifyKeycloakToken: vi.fn() }));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...await importOriginal<object>(), slackAlert: vi.fn() }));
vi.mock('../../../lib/api/env', () => ({
  default: {
    APP_NAME: 'website',
    ALERTS_SLACK_BOT_TOKEN: 'slack-token',
    ALERTS_SLACK_CHANNEL_ID: 'channel-id',
    NOTION_API_TOKEN: 'notion-token',
  },
}));
vi.mock('../../../lib/api/topTalentCrm', async (importOriginal) => ({
  ...await importOriginal<object>(),
  findByLinkedIn: vi.fn(),
  resolveOwnerByEmail: vi.fn(),
  createPerson: vi.fn(),
  updatePerson: vi.fn(),
}));

const routes: { name: string; handler: NextApiHandler; body: unknown }[] = [
  { name: 'check-dup', handler: checkDup, body: { linkedInUrl: 'https://www.linkedin.com/in/ada/' } },
  { name: 'create', handler: create, body: { name: 'Ada Lovelace', linkedInUrl: 'https://www.linkedin.com/in/ada/' } },
  { name: 'update', handler: update, body: { pageId: 'p1' } },
];

const call = async (handler: NextApiHandler, body: unknown) => {
  const res = {
    statusCode: 0,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
    end() {
      return this;
    },
  };
  await handler({
    method: 'POST', headers: { authorization: 'Bearer token' }, body, url: '/api/top-talent-crm',
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return res.statusCode;
};

const mockAuth = (email: string, emailVerified: boolean) => {
  vi.mocked(verifyKeycloakToken).mockResolvedValue({
    iss: 'https://login.bluedot.org/realms/customers',
    aud: 'bluedot-web-apps',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: 'user-1',
    email,
    email_verified: emailVerified,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findByLinkedIn).mockResolvedValue(null);
  vi.mocked(resolveOwnerByEmail).mockResolvedValue('notion-user-1');
  vi.mocked(createPerson).mockResolvedValue({ id: 'p1', url: 'https://notion.so/p1' });
  vi.mocked(updatePerson).mockResolvedValue({ id: 'p1' });
});

describe.each(routes)('POST /api/top-talent-crm/$name', ({ handler, body }) => {
  test('allows verified bluedot.org staff', async () => {
    mockAuth('dewi@bluedot.org', true);
    expect(await call(handler, body)).toBe(200);
  });

  test('rejects an unverified bluedot.org email without touching Notion', async () => {
    mockAuth('dewi@bluedot.org', false);
    expect(await call(handler, body)).toBe(403);
    expect(findByLinkedIn).not.toHaveBeenCalled();
    expect(resolveOwnerByEmail).not.toHaveBeenCalled();
    expect(createPerson).not.toHaveBeenCalled();
    expect(updatePerson).not.toHaveBeenCalled();
  });

  test('rejects a verified non-bluedot email', async () => {
    mockAuth('someone@gmail.com', true);
    expect(await call(handler, body)).toBe(403);
  });
});
