import { bugReportsTable } from '@bluedot/db';
import * as bluedotUtils from '@bluedot/utils';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, setupTestDb, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('@bluedot/utils', async () => {
  const actual = await vi.importActual<typeof bluedotUtils>('@bluedot/utils');
  return {
    ...actual,
    slackAlert: vi.fn(),
  };
});

const { slackAlert } = bluedotUtils;

setupTestDb();

const validInput = {
  description: 'The discussion calendar invite is broken',
  email: 'reporter@example.com',
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.mocked(slackAlert).mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('feedback.submitBugReport: input validation', () => {
  test('rejects an empty description', async () => {
    await expect(createCaller().feedback.submitBugReport({ ...validInput, description: '' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects a description over 5000 chars', async () => {
    await expect(createCaller().feedback.submitBugReport({
      ...validInput, description: 'a'.repeat(5001),
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects an invalid email', async () => {
    await expect(createCaller().feedback.submitBugReport({ ...validInput, email: 'not-an-email' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects a non-URL recordingUrl', async () => {
    await expect(createCaller().feedback.submitBugReport({
      ...validInput, recordingUrl: 'not a url',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects more than 5 attachments', async () => {
    const attachment = { base64: 'dGVzdA==', filename: 'a.png', mimeType: 'image/png' };
    await expect(createCaller().feedback.submitBugReport({
      ...validInput,
      attachments: Array.from({ length: 6 }, () => attachment),
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('feedback.submitBugReport: persistence', () => {
  test('inserts a bug-report row with description, email, createdAt and a null recordingUrl', async () => {
    const before = Math.floor(Date.now() / 1000);
    const result = await createCaller().feedback.submitBugReport(validInput);

    expect(result).toBeNull();

    const rows = await testDb.scan(bugReportsTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      description: validInput.description,
      email: validInput.email,
      recordingUrl: null,
    });
    expect(rows[0]!.createdAt).toBeGreaterThanOrEqual(before);
  });

  test('persists the recordingUrl when supplied', async () => {
    await createCaller().feedback.submitBugReport({
      ...validInput,
      recordingUrl: 'https://granola.example/recording-123',
    });

    const rows = await testDb.scan(bugReportsTable);
    expect(rows[0]!.recordingUrl).toBe('https://granola.example/recording-123');
  });

  test('does not call fetch when no attachments are supplied', async () => {
    await createCaller().feedback.submitBugReport(validInput);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('feedback.submitBugReport: attachment upload', () => {
  const attachment = {
    base64: 'aGVsbG8=', // "hello"
    filename: 'screenshot.png',
    mimeType: 'image/png',
  };

  test('POSTs each attachment to the Airtable content API with the right body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await createCaller().feedback.submitBugReport({
      ...validInput,
      attachments: [attachment, { ...attachment, filename: 'second.png' }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(typeof url).toBe('string');
    expect(url).toContain('content.airtable.com');
    expect(url).toContain('uploadAttachment');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toMatch(/^Bearer /);
    expect(init.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      filename: 'screenshot.png',
      file: attachment.base64,
      contentType: attachment.mimeType,
    });
  });

  test('still resolves and inserts the row when an attachment upload fails (non-2xx)', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Request', { status: 400, statusText: 'Bad Request' }));

    const result = await createCaller().feedback.submitBugReport({
      ...validInput,
      attachments: [attachment],
    });
    expect(result).toBeNull();

    const rows = await testDb.scan(bugReportsTable);
    expect(rows).toHaveLength(1);
    expect(vi.mocked(slackAlert)).toHaveBeenCalledTimes(1);
  });

  test('still resolves when fetch itself rejects (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await createCaller().feedback.submitBugReport({
      ...validInput,
      attachments: [attachment],
    });
    expect(result).toBeNull();
    expect(vi.mocked(slackAlert)).toHaveBeenCalledTimes(1);
  });
});
