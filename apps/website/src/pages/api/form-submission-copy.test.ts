import { applicationsRoundTable } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setupTestDb, testDb } from '../../__tests__/dbTestUtils';
import type * as CustomerIo from '../../lib/api/customerio';
import { sendFormSubmissionCopy } from '../../lib/api/customerio';
import { deriveFormSubmissionCopyToken } from '../../lib/formSubmissionCopy/formSubmissionCopy';
import { resetFormSubmissionCopyRateLimits } from '../../lib/formSubmissionCopy/sendFormSubmissionCopyForRecord';
import handler from './form-submission-copy';

vi.mock('../../lib/api/customerio', async (importOriginal) => ({
  ...(await importOriginal<typeof CustomerIo>()),
  sendFormSubmissionCopy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

vi.mock('../../lib/api/env', () => ({
  default: {
    APP_NAME: 'test-app',
    ALERTS_SLACK_BOT_TOKEN: 'fake-token',
    ALERTS_SLACK_CHANNEL_ID: 'fake-channel',
    AIRTABLE_AUTOMATION_TOKEN: 'automation-secret',
    AIRTABLE_PERSONAL_ACCESS_TOKEN: 'fake-pat',
    VITEST: 'true',
  },
}));

setupTestDb();

const mockedSend = vi.mocked(sendFormSubmissionCopy);
const mockedAlert = vi.mocked(slackAlert);

const RECORD_ID = 'recAbCdEfGhIjKlMn';
const RECORD_URL = `https://api.airtable.com/v0/appnJbsG1eWbAdEvf/tblXKnWoXK3R63F6D/${RECORD_ID}?returnFieldsByFieldId=true`;
const META_URL = 'https://api.airtable.com/v0/meta/bases/appnJbsG1eWbAdEvf/tables';

const FIELD_NAMES: Record<string, string> = {
  fldkEQ0zBUhqpIuJn: 'Course (single select)',
  fldYaHSLqnvBXyjur: 'Round',
  fldIhZ4wc5t1Yabgz: 'First name',
  fldHa6GR5aBsOBtkz: 'Last name',
  fld0g392xytratknm: 'Email',
  fldqNrt2OdsIsulMD: 'Skills',
  fldEPZ0UfYoypB1mp: 'Total score',
  fldRoundName: '[*] Round name',
  fld5G27T1IMkkkoGN: 'PostHog Session ID',
  fldNew1: 'Brand new question',
  fldNew2: 'Another new one',
};

const metaResponse = () => new Response(JSON.stringify({
  tables: [{ id: 'tblXKnWoXK3R63F6D', fields: Object.entries(FIELD_NAMES).map(([id, name]) => ({ id, name, type: 'singleLineText' })) }],
}));

const validFields = {
  fldkEQ0zBUhqpIuJn: 'AGI Strategy',
  fldYaHSLqnvBXyjur: ['recRound1'],
  fldIhZ4wc5t1Yabgz: 'Ada',
  fldHa6GR5aBsOBtkz: 'Lovelace',
  fld0g392xytratknm: 'ada@example.com',
  fldqNrt2OdsIsulMD: 'Writing',
  fldEPZ0UfYoypB1mp: 42,
  fldRoundName: 'R1',
  fld5G27T1IMkkkoGN: 'ph1',
};

function stubRecord(fields: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => (url.startsWith(META_URL)
    ? metaResponse()
    : new Response(JSON.stringify({ id: RECORD_ID, fields }))));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function createMockReqRes({ method = 'POST', query = {}, body }: { method?: string; query?: Record<string, string>; body?: unknown } = {}) {
  const req = {
    method,
    headers: {},
    url: '/api/form-submission-copy',
    query: {
      form: 'AGI Strategy Course application', token: deriveFormSubmissionCopyToken(), recordId: RECORD_ID, ...query,
    },
    body,
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse;

  return { req, res };
}

describe('form-submission-copy', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetFormSubmissionCopyRateLimits();
    await testDb.insert(applicationsRoundTable, { id: 'recRound1', courseRoundIntensity: 'AGI Strategy (2026 Jan W02) - Part-time' });
    stubRecord(validFields);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 for a wrong or missing token', async () => {
    const wrong = createMockReqRes({ query: { token: 'wrong' } });
    await handler(wrong.req, wrong.res);
    expect(wrong.res.status).toHaveBeenCalledWith(401);

    const missing = createMockReqRes();
    delete (missing.req.query as Record<string, unknown>).token;
    await handler(missing.req, missing.res);
    expect(missing.res.status).toHaveBeenCalledWith(401);

    const rawSecret = createMockReqRes({ query: { token: 'automation-secret' } });
    await handler(rawSecret.req, rawSecret.res);
    expect(rawSecret.res.status).toHaveBeenCalledWith(401);
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('returns 400 and alerts for a missing or unknown form', async () => {
    const unknown = createMockReqRes({ query: { form: 'Some other form' } });
    await handler(unknown.req, unknown.res);
    expect(unknown.res.status).toHaveBeenCalledWith(400);
    expect(mockedAlert).toHaveBeenCalledTimes(1);
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('form="Some other form", which has no config');
    expect(mockedAlert.mock.calls[0]![1][0]).toContain(RECORD_ID);
    await handler(unknown.req, unknown.res);
    expect(mockedAlert).toHaveBeenCalledTimes(2);

    const missing = createMockReqRes();
    delete (missing.req.query as Record<string, unknown>).form;
    await handler(missing.req, missing.res);
    expect(missing.res.status).toHaveBeenCalledWith(400);
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('returns 400 for a missing recordId', async () => {
    const missing = createMockReqRes();
    delete (missing.req.query as Record<string, unknown>).recordId;
    await handler(missing.req, missing.res);
    expect(missing.res.status).toHaveBeenCalledWith(400);
    expect(fetch).not.toHaveBeenCalled();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('reads the record and sends the copy, returning 200', async () => {
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(fetch).toHaveBeenCalledWith(RECORD_URL, { headers: { Authorization: 'Bearer fake-pat' } });
    expect(mockedSend).toHaveBeenCalledTimes(1);
    const sent = mockedSend.mock.calls[0]![0];
    expect(sent.to).toBe('ada@example.com');
    expect(sent.subject).toBe('Copy of your responses: AGI Strategy Course application');
    expect(sent.html).toContain('Thanks for filling out "AGI Strategy Course application"');
    expect(sent.html).toContain('AGI Strategy (2026 Jan W02) - Part-time');
    expect(sent.html).toContain('What skills will you contribute?');
    expect(sent.html).not.toContain('42');
    expect(mockedAlert).not.toHaveBeenCalled();
  });

  it('ignores the posted body', async () => {
    const { req, res } = createMockReqRes({
      body: { fields: { ...validFields, fld0g392xytratknm: 'victim@example.com', fldqNrt2OdsIsulMD: 'Posted text' } },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const sent = mockedSend.mock.calls[0]![0];
    expect(sent.to).toBe('ada@example.com');
    expect(sent.html).not.toContain('Posted text');
  });

  it('alerts on unknown fields and still sends', async () => {
    stubRecord({ ...validFields, fldNew1: 'x', fldNew2: 'y' });
    for (let i = 0; i < 2; i += 1) {
      const { req, res } = createMockReqRes();
      // eslint-disable-next-line no-await-in-loop
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    }

    expect(mockedSend).toHaveBeenCalledTimes(2);
    expect(mockedAlert).toHaveBeenCalledTimes(2);
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('"Brand new question" (fldNew1), "Another new one" (fldNew2) were not found in either of `fieldAllowList` or `fieldDenyList`');
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('"Copy of your responses: AGI Strategy Course application" email');
  });

  it('stops sending to an address after 5 copies in 30 minutes, without alerting', async () => {
    for (let i = 0; i < 5; i += 1) {
      const { req, res } = createMockReqRes();
      // eslint-disable-next-line no-await-in-loop
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    }

    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(mockedSend).toHaveBeenCalledTimes(5);
    expect(mockedAlert).not.toHaveBeenCalled();
  });

  it('alerts on a blank required field and still sends', async () => {
    const { fldYaHSLqnvBXyjur: _round, ...withoutRound } = validFields;
    stubRecord(withoutRound);
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(mockedSend.mock.calls[0]![0].html).not.toContain('Round');
    expect(mockedAlert).toHaveBeenCalledTimes(1);
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('"Round" (fldYaHSLqnvBXyjur) is marked required in `fieldAllowList` but has no value. The email was sent without this field.');
  });

  it('alerts, sends nothing and returns 500 on a config error', async () => {
    stubRecord({ ...validFields, fld0g392xytratknm: 'not-an-email' });
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockedSend).not.toHaveBeenCalled();
    expect(mockedAlert).toHaveBeenCalledTimes(1);
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('email field "Email" (fld0g392xytratknm) is missing or invalid');
    expect(mockedAlert.mock.calls[0]![1][0]).toContain(RECORD_ID);
  });

  it('alerts every time, sends nothing and returns 500 when the record read fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith(META_URL) ? metaResponse() : new Response('{}', { status: 404 }))));
    for (let i = 0; i < 2; i += 1) {
      const { req, res } = createMockReqRes({ query: { form: 'Biosecurity Course application' } });
      // eslint-disable-next-line no-await-in-loop
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    }

    expect(mockedSend).not.toHaveBeenCalled();
    expect(mockedAlert).toHaveBeenCalledTimes(2);
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('reading the record from Airtable failed');
    expect(mockedAlert.mock.calls[0]![1][0]).toContain('HTTP 404');
    expect(mockedAlert.mock.calls[0]![1][0]).toContain(RECORD_ID);
  });
});
