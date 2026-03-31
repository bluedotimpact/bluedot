import type { NextApiRequest, NextApiResponse } from 'next';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createMockCourseRegistration,
  createMockGroupDiscussion,
  createMockMeetPerson,
  createMockUnit,
} from '../../../../testUtils';
import { ONE_HOUR_SECONDS } from '../../../../../lib/constants';

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    loginPresets: {
      keycloak: {
        verifyAndDecodeToken: vi.fn(),
      },
    },
  };
});

vi.mock('../../../../../../lib/api/env', () => ({
  default: {
    APP_NAME: 'website',
    ALERTS_SLACK_BOT_TOKEN: 'slack-token',
    ALERTS_SLACK_CHANNEL_ID: 'channel-id',
    CLIENT_ERRORS_SLACK_CHANNEL_ID: 'client-errors',
    PG_URL: 'postgres://localhost/test',
    AIRTABLE_PERSONAL_ACCESS_TOKEN: 'airtable-token',
    KEYCLOAK_CLIENT_ID: 'keycloak-client',
    KEYCLOAK_CLIENT_SECRET: 'keycloak-secret',
  },
}));

vi.mock('../../../../../lib/api/db', () => ({
  default: {
    get: vi.fn(),
    scan: vi.fn(),
  },
}));

import { loginPresets } from '@bluedot/ui';
import handler from '../../../../../pages/api/calendar/discussions/[discussionId]';
import db from '../../../../../lib/api/db';

const unfoldIcs = (content: string) => content.replaceAll('\r\n ', '');

function createMockReqRes(overrides: Partial<NextApiRequest> = {}) {
  const req = {
    method: 'GET',
    query: { discussionId: 'discussion-1' },
    headers: {
      host: 'bluedot.org',
      authorization: 'Bearer valid-token',
    },
    ...overrides,
  } as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  } as unknown as NextApiResponse;

  return { req, res };
}

describe('calendar discussion download api', () => {
  const mockAuth = {
    iss: 'https://auth.example.com',
    aud: 'bluedot-website',
    exp: Date.now() / 1000 + ONE_HOUR_SECONDS,
    sub: 'user-1',
    email: 'ash@example.com',
    email_verified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-GET requests', async () => {
    const { req, res } = createMockReqRes({ method: 'POST' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns 401 when the user is not authenticated', async () => {
    const { req, res } = createMockReqRes({
      headers: { host: 'bluedot.org' },
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing access token' });
  });

  it('returns 403 when the authenticated user is not attached to the discussion', async () => {
    const { req, res } = createMockReqRes();

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(mockAuth);
    vi.mocked(db.get).mockResolvedValueOnce(createMockGroupDiscussion({
      id: 'discussion-1',
      participantsExpected: ['meet-person-1'],
    }));
    vi.mocked(db.scan)
      .mockResolvedValueOnce([createMockMeetPerson({
        id: 'meet-person-1',
        email: 'someone-else@example.com',
        applicationsBaseRecordId: 'course-registration-1',
      })])
      .mockResolvedValueOnce([createMockCourseRegistration({
        id: 'course-registration-1',
        email: 'someone-else@example.com',
      })]);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You do not have access to this discussion' });
  });

  it('returns a calendar file for an attached user', async () => {
    const { req, res } = createMockReqRes();

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(mockAuth);
    vi.mocked(db.get)
      .mockResolvedValueOnce(createMockGroupDiscussion({
        id: 'discussion-1',
        unitNumber: 2,
        startDateTime: 1774954800,
        endDateTime: 1774958400,
        participantsExpected: ['meet-person-1'],
        zoomLink: 'https://zoom.us/j/123456789?pwd=abc123',
        activityDoc: 'https://docs.google.com/document/d/abc123',
      }))
      .mockResolvedValueOnce(createMockUnit({
        id: 'unit-2',
        unitNumber: '2',
        title: 'Key Concepts',
        courseTitle: 'Introduction to AI Safety',
        path: '/courses/ai-safety/2',
      }));
    vi.mocked(db.scan)
      .mockResolvedValueOnce([createMockMeetPerson({
        id: 'meet-person-1',
        email: 'ash@example.com',
        applicationsBaseRecordId: 'course-registration-1',
      })])
      .mockResolvedValueOnce([createMockCourseRegistration({
        id: 'course-registration-1',
        email: 'ash@example.com',
      })]);

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('introduction-to-ai-safety-unit-2-key-concepts.ics'),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledTimes(1);

    const [sentIcs] = vi.mocked(res.send).mock.calls[0]!;
    const unfoldedIcs = unfoldIcs(sentIcs as string);

    expect(unfoldedIcs).toContain('BEGIN:VCALENDAR');
    expect(unfoldedIcs).toContain('Join Zoom: https://zoom.us/j/123456789?pwd=abc123');
    expect(unfoldedIcs).toContain('Course page: https://bluedot.org/courses/ai-safety/2');
  });
});
