import {
  applicationsRoundTable, courseRegistrationTable, courseTable, eq, exerciseResponsePgTable, exerciseTable,
  meetPersonTable, roundTable, selfServeCourseRegistrationTable,
} from '@bluedot/db';
import {
  describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { issueFoaiCertificateIfComplete } from './certificates';

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

describe('certificates.createFacilitatedCourseCertificate (Airtable-script callable, shared-secret auth)', () => {
  test('throws UNAUTHORIZED when token is the wrong length (length mismatch short-circuits before timingSafeEqual)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'c1',
    });

    await expect(createCaller(testAuthContextLoggedOut).certificates.createFacilitatedCourseCertificate({
      courseRegistrationId: 'reg1',
      publicToken: 'wrong',
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws UNAUTHORIZED for a same-length but different token', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'c1',
    });

    const sameLengthWrong = 'X'.repeat(TEST_CERT_TOKEN.length);
    await expect(createCaller(testAuthContextLoggedOut).certificates.createFacilitatedCourseCertificate({
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

    const result = await createCaller(testAuthContextLoggedOut).certificates.createFacilitatedCourseCertificate({
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
    const result = await createCaller(testAuthContextLoggedOut).certificates.createFacilitatedCourseCertificate({
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

  test('returns { isOwner: false } when no certificate matches the id', async () => {
    const result = await createCaller(testAuthContextLoggedIn)
      .certificates.verifyOwnership({ certificateId: 'nonexistent' });
    expect(result).toEqual({ isOwner: false });
  });

  test('finds certificates on the self-serve table, matching email case-insensitively', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-reg-1', email: 'TEST@Example.com', courseId: FOAI_COURSE_ID, certificateId: 'cert-ss',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .certificates.verifyOwnership({ certificateId: 'cert-ss' });
    expect(result).toEqual({ isOwner: true });
  });

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

describe('certificates.getStatus', () => {
  test('returns not-authenticated with hasUpcomingRounds: false when none exist', async () => {
    const result = await createCaller(testAuthContextLoggedOut).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'not-authenticated', hasUpcomingRounds: false });
  });

  test('returns not-authenticated with hasUpcomingRounds: true when an upcoming round exists', async () => {
    await testDb.insert(applicationsRoundTable, {
      id: 'round-upcoming', courseId: FOAI_COURSE_ID, applicationDeadline: '2999-01-01',
    });

    const result = await createCaller(testAuthContextLoggedOut).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'not-authenticated', hasUpcomingRounds: true });
  });

  test('treats a round with null applicationDeadline as upcoming', async () => {
    await testDb.insert(applicationsRoundTable, {
      id: 'round-tbd', courseId: FOAI_COURSE_ID, applicationDeadline: null,
    });

    const result = await createCaller(testAuthContextLoggedOut).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'not-authenticated', hasUpcomingRounds: true });
  });

  test('returns not-enrolled with hasUpcomingRounds when the auth user has no accepted registration', async () => {
    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'not-enrolled', hasUpcomingRounds: false });
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
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      courseId: FOAI_COURSE_ID,
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
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      courseId: FOAI_COURSE_ID,
      certificateId: 'cert-1',
      certificateCreatedAt: 1700000000,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toMatchObject({ status: 'has-certificate', recipientName: '' });
  });

  test('returns exercises-incomplete for FOAI registrations without a certificate', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'exercises-incomplete' });
  });

  test('returns not-eligible for non-FOAI registrations without a meetPerson record', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'not-eligible', hasUpcomingRounds: false });
  });

  test('returns action-plan-pending for non-FOAI Participants, with submission flag', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(roundTable, {
      id: 'round1', lastDiscussionDate: '2020-01-01',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1',
      applicationsBaseRecordId: 'reg1',
      role: 'Participant',
      round: 'round1',
      projectSubmission: ['https://example.com/plan'],
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({
      status: 'action-plan-pending',
      meetPersonId: 'mp1',
      hasSubmittedActionPlan: true,
      isLastDiscussionSoonOrPassed: true,
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

  test('returns is-facilitator for non-FOAI Facilitators', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Facilitator',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'is-facilitator' });
  });

  test('returns not-eligible for an unrecognised meetPerson role', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Observer',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'not-eligible', hasUpcomingRounds: false });
  });

  test('returns attendance-ineligible when a participant misses more than one discussion', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(roundTable, {
      id: 'round1', lastDiscussionDate: '2020-01-01',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1',
      applicationsBaseRecordId: 'reg1',
      role: 'Participant',
      round: 'round1',
      uniqueDiscussionAttendance: 3,
      numUnits: 5,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({
      status: 'attendance-ineligible',
      uniqueDiscussionAttendance: 3,
      numUnits: 5,
      isLastDiscussionSoonOrPassed: true,
    });
  });
});

describe('issueFoaiCertificateIfComplete', () => {
  const setupCompletedFoaiExercises = async (email: string) => {
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 1', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', email, exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });
  };

  test('issues the certificate on the self-serve row only', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', email: 'test@example.com', courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await setupCompletedFoaiExercises('test@example.com');

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');

    const legacy = await testDb.get(courseRegistrationTable, { id: 'reg-foai' });
    expect(legacy.certificateId).toBeNull();
  });

  test('does nothing when no self-serve row exists', async () => {
    // Self-serve is authoritative post read-switch; a learner without a self-serve row can't be issued to.
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await setupCompletedFoaiExercises('test@example.com');

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(false);

    const legacy = await testDb.get(courseRegistrationTable, { id: 'reg-foai' });
    expect(legacy.certificateId).toBeNull();
  });

  test('writes nothing when exercises are incomplete', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 1', exerciseNumber: '1',
    });

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(false);

    const legacy = await testDb.get(courseRegistrationTable, { id: 'reg-foai' });
    expect(legacy.certificateId).toBeNull();
    expect(await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)).toEqual([]);
  });

  test('issues the certificate even when an optional exercise is incomplete', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', email: 'test@example.com', courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Required', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', email: 'test@example.com', exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });
    // Optional exercise with no completed response — must not block the certificate.
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-opt', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Optional', exerciseNumber: '2', isOptional: true,
    });

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');
  });

  test('issues the certificate even when a Further or Maybe exercise is incomplete', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', email: 'test@example.com', courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Required', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', email: 'test@example.com', exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });
    // Further/Maybe exercises with no completed response — must not block the certificate.
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-further', courseId: FOAI_COURSE_ID, status: 'Further', title: 'Further', exerciseNumber: '2',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-maybe', courseId: FOAI_COURSE_ID, status: 'Maybe', title: 'Maybe', exerciseNumber: '3',
    });

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');
  });

  test('does not issue the certificate while a Core exercise is incomplete, and issues once it is completed', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', email: 'test@example.com', courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-core', courseId: FOAI_COURSE_ID, status: 'Core', title: 'Core', exerciseNumber: '1',
    });

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(false);

    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-core', email: 'test@example.com', exerciseId: 'foai-ex-core', response: 'done', completedAt: '2026-01-01',
    });

    expect(await issueFoaiCertificateIfComplete('test@example.com')).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');
  });
});
