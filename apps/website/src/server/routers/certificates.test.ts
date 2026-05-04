import {
  courseRegistrationTable, courseTable, exerciseResponseTable, exerciseTable, meetPersonTable,
} from '@bluedot/db';
import {
  describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID } from '../../lib/constants';

vi.mock('../../lib/api/env', () => ({
  default: {
    APP_NAME: 'website',
    PG_URL: 'postgresql://fake',
    AIRTABLE_PERSONAL_ACCESS_TOKEN: 'fake',
    ALERTS_SLACK_CHANNEL_ID: 'C',
    CLIENT_ERRORS_SLACK_CHANNEL_ID: 'C',
    ALERTS_SLACK_BOT_TOKEN: 'fake',
    KEYCLOAK_CLIENT_ID: 'fake',
    KEYCLOAK_CLIENT_SECRET: 'fake',
    CERTIFICATE_CREATION_TOKEN: 'test-token-secret',
    VITEST: 'true',
  },
}));

const TEST_CERT_TOKEN = 'test-token-secret';

setupTestDb();

describe('certificates.create (Airtable-script callable, shared-secret auth)', () => {
  test('throws UNAUTHORIZED when token is the wrong length (length mismatch short-circuits before timingSafeEqual)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'c1',
    });

    await expect(createCaller(testAuthContextLoggedOut).certificates.create({
      courseRegistrationId: 'reg1',
      publicToken: 'wrong',
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws UNAUTHORIZED for a same-length but different token', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'c1',
    });

    const sameLengthWrong = 'X'.repeat(TEST_CERT_TOKEN.length);
    await expect(createCaller(testAuthContextLoggedOut).certificates.create({
      courseRegistrationId: 'reg1',
      publicToken: sameLengthWrong,
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  // Note: the "registration not found" branch is unreachable as written. The router calls
  // db.get(courseRegistrationTable, { id }), which throws AirtableTsError(RESOURCE_NOT_FOUND)
  // rather than returning undefined — so the explicit `if (!courseRegistration)` NOT_FOUND
  // throw in the router is dead code. Worth a separate look (router should use getFirst, or
  // catch the AirtableTsError, to behave as written).

  test('returns the existing certificate without re-issuing if one is already present', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      courseId: 'c1',
      certificateId: 'reg1',
      certificateCreatedAt: 1700000000,
    });

    const result = await createCaller(testAuthContextLoggedOut).certificates.create({
      courseRegistrationId: 'reg1',
      publicToken: TEST_CERT_TOKEN,
    });
    expect(result).toEqual({ certificateId: 'reg1', certificateCreatedAt: 1700000000 });

    const reg = await testDb.get(courseRegistrationTable, { id: 'reg1' });
    expect(reg.certificateCreatedAt).toBe(1700000000);
  });

  test('issues a new certificate and persists certificateId/certificateCreatedAt', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'c1',
    });

    const before = Math.floor(Date.now() / 1000);
    const result = await createCaller(testAuthContextLoggedOut).certificates.create({
      courseRegistrationId: 'reg1',
      publicToken: TEST_CERT_TOKEN,
    });

    expect(result.certificateId).toBe('reg1');
    expect(result.certificateCreatedAt).toBeGreaterThanOrEqual(before);

    const reg = await testDb.get(courseRegistrationTable, { id: 'reg1' });
    expect(reg.certificateId).toBe('reg1');
    expect(reg.certificateCreatedAt).toBeGreaterThanOrEqual(before);
  });
});

describe('certificates.verifyOwnership', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).certificates.verifyOwnership({ certificateId: 'cert-1' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  // Note: when no matching registration exists for the certificateId, the router uses
  // db.get(...) which throws AirtableTsError(RESOURCE_NOT_FOUND) rather than returning undefined.
  // The router code at certificates.ts:66 reads `registration?.email`, expecting undefined — so
  // the "no record" case currently surfaces as a thrown error rather than `{ isOwner: false }`.
  // Same root cause as the dead-code note in `certificates.create` above.

  // `id` and `certificateId` are deliberately distinct in these fixtures so the test proves the
  // router is actually filtering on the certificateId column, not implicitly resolving by primary key.
  test('returns { isOwner: false } when the certificate belongs to someone else', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-someone-else', email: 'someone-else@example.com', courseId: 'c1', certificateId: 'cert-1',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .certificates.verifyOwnership({ certificateId: 'cert-1' });
    expect(result).toEqual({ isOwner: false });
  });

  test('returns { isOwner: true } for the owner, case-insensitively', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-owner', email: 'TEST@Example.com', courseId: 'c1', certificateId: 'cert-1',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .certificates.verifyOwnership({ certificateId: 'cert-1' });
    expect(result).toEqual({ isOwner: true });
  });
});

describe('certificates.request (FOAI self-serve)', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).certificates.request({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws NOT_FOUND when the user has no accepted registration for the course', async () => {
    await expect(createCaller(testAuthContextLoggedIn).certificates.request({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('returns the existing registration unchanged if it already has a certificate', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai',
      email: 'test@example.com',
      courseId: FOAI_COURSE_ID,
      decision: 'Accept',
      certificateId: 'reg-foai',
      certificateCreatedAt: 1700000000,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.request({ courseId: FOAI_COURSE_ID });
    expect(result.certificateId).toBe('reg-foai');
    expect(result.certificateCreatedAt).toBe(1700000000);
  });

  test('throws FORBIDDEN for non-FOAI courses (admin-issued only)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      courseId: 'rec-not-foai',
      decision: 'Accept',
    });

    await expect(createCaller(testAuthContextLoggedIn).certificates.request({ courseId: 'rec-not-foai' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('throws BAD_REQUEST when the FOAI course has no active exercises configured', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });

    await expect(createCaller(testAuthContextLoggedIn).certificates.request({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringMatching(/No exercises/) });
  });

  test('throws BAD_REQUEST listing the still-incomplete exercises', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await testDb.insert(exerciseTable, {
      id: 'ex1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Reading reflection', exerciseNumber: '1',
    });
    await testDb.insert(exerciseTable, {
      id: 'ex2', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Action plan', exerciseNumber: '2',
    });
    // Only ex1 is completed
    await testDb.insert(exerciseResponseTable, {
      id: 'resp1', email: 'test@example.com', exerciseId: 'ex1', response: '...', completedAt: '2026-01-01',
    });

    await expect(createCaller(testAuthContextLoggedIn).certificates.request({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('Action plan'),
      });
  });

  test('issues the certificate when every active exercise has a completed response', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await testDb.insert(exerciseTable, {
      id: 'ex1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 1', exerciseNumber: '1',
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'resp1', email: 'test@example.com', exerciseId: 'ex1', response: '...', completedAt: '2026-01-01',
    });

    const before = Math.floor(Date.now() / 1000);
    const result = await createCaller(testAuthContextLoggedIn).certificates.request({ courseId: FOAI_COURSE_ID });

    expect(result.certificateId).toBe('reg-foai');
    expect(result.certificateCreatedAt).toBeGreaterThanOrEqual(before);
  });
});

describe('certificates.getStatus', () => {
  test('returns not-eligible for unauthenticated callers', async () => {
    const result = await createCaller(testAuthContextLoggedOut).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'not-eligible' });
  });

  test('returns not-eligible when the auth user has no accepted registration', async () => {
    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'not-eligible' });
  });

  test('returns has-certificate when the registration has a certificateId', async () => {
    await testDb.insert(courseTable, {
      id: FOAI_COURSE_ID,
      slug: 'future-of-ai',
      shortDescription: 'short',
      title: 'Future of AI',
      certificationDescription: 'cert desc',
      detailsUrl: 'https://example.com/foai',
      units: [],
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      courseId: FOAI_COURSE_ID,
      decision: 'Accept',
      certificateId: 'cert-1',
      certificateCreatedAt: 1700000000,
      fullName: 'Dewi Erwan',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({
      status: 'has-certificate',
      certificateId: 'cert-1',
      certificateCreatedAt: 1700000000,
      recipientName: 'Dewi Erwan',
      courseName: 'Future of AI',
      courseSlug: 'future-of-ai',
      certificationDescription: 'cert desc',
      courseDetailsUrl: 'https://example.com/foai',
    });
  });

  test('returns empty recipientName when fullName is missing', async () => {
    await testDb.insert(courseTable, {
      id: FOAI_COURSE_ID,
      slug: 'future-of-ai',
      shortDescription: 'short',
      title: 'Future of AI',
      units: [],
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      courseId: FOAI_COURSE_ID,
      decision: 'Accept',
      certificateId: 'cert-1',
      certificateCreatedAt: 1700000000,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toMatchObject({ status: 'has-certificate', recipientName: '' });
  });

  test('returns can-request for FOAI registrations without a certificate', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'can-request' });
  });

  test('returns not-eligible for non-FOAI registrations without a meetPerson record', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'not-eligible' });
  });

  test('returns action-plan-pending for non-FOAI Participants, with submission flag', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1',
      applicationsBaseRecordId: 'reg1',
      role: 'Participant',
      projectSubmission: ['https://example.com/plan'],
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({
      status: 'action-plan-pending',
      meetPersonId: 'mp1',
      hasSubmittedActionPlan: true,
    });
  });

  test('returns hasSubmittedActionPlan: false when projectSubmission is empty', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Participant', projectSubmission: [],
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toMatchObject({ status: 'action-plan-pending', hasSubmittedActionPlan: false });
  });

  test('returns facilitator-pending for non-FOAI Facilitators', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Facilitator',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'facilitator-pending' });
  });

  test('returns not-eligible for an unrecognised meetPerson role', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Observer',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'not-eligible' });
  });
});
