import {
  applicationsRoundTable, courseRegistrationTable, courseTable, eq, exerciseResponsePgTable, exerciseTable,
  groupDiscussionTable, meetPersonTable, roundTable, selfServeCourseRegistrationTable, userTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
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
    AIRTABLE_AUTOMATION_TOKEN: 'test-token-secret',
    VITEST: 'true',
  },
}));

const TEST_CERT_TOKEN = 'test-token-secret';

setupTestDb();

// The authenticated user's row is assumed to exist by the userId-scoped routes.
beforeEach(async () => {
  await seedLoggedInUser();
  await testDb.insert(userTable, { id: 'user-other', email: 'someone-else@example.com', name: 'Someone Else' });
});

describe('certificates.createFacilitatedCourseCertificate (Airtable-script callable, shared-secret auth)', () => {
  test('throws UNAUTHORIZED when token is the wrong length (length mismatch short-circuits before timingSafeEqual)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'c1',
    });

    await expect(createCaller(testAuthContextLoggedOut).certificates.createFacilitatedCourseCertificate({
      courseRegistrationId: 'reg1',
      publicToken: 'wrong',
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws UNAUTHORIZED for a same-length but different token', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'c1',
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
      userId: 'test-user',
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
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'c1',
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

  test('returns { isOwner: true } when the self-serve registration userId matches the caller', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-reg-1', userId: 'test-user', courseId: FOAI_COURSE_ID, certificateId: 'cert-ss',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .certificates.verifyOwnership({ certificateId: 'cert-ss' });
    expect(result).toEqual({ isOwner: true });
  });

  // `id` and `certificateId` are deliberately distinct in these fixtures so the test proves the
  // router is actually filtering on the certificateId column, not implicitly resolving by primary key.
  test('returns { isOwner: false } when the certificate belongs to someone else', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-someone-else', email: 'someone-else@example.com', userId: 'user-other', courseId: 'c1', certificateId: 'cert-1',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .certificates.verifyOwnership({ certificateId: 'cert-1' });
    expect(result).toEqual({ isOwner: false });
  });

  test('returns { isOwner: true } when the facilitated registration userId matches the caller', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-owner', email: 'test@example.com', userId: 'test-user', courseId: 'c1', certificateId: 'cert-1',
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
      userId: 'test-user',
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
      userId: 'test-user',
      courseId: FOAI_COURSE_ID,
      certificateId: 'cert-1',
      certificateCreatedAt: 1700000000,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toMatchObject({ status: 'has-certificate', recipientName: '' });
  });

  test('returns exercises-incomplete for FOAI registrations without a certificate', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-reg-foai', userId: 'test-user', courseId: FOAI_COURSE_ID,
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: FOAI_COURSE_ID });
    expect(result).toEqual({ status: 'exercises-incomplete' });
  });

  test('returns not-eligible for non-FOAI registrations without a meetPerson record', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'rec-other', decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'not-eligible', hasUpcomingRounds: false });
  });

  test('returns action-plan-pending for non-FOAI Participants, with submission flag', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'rec-other', decision: 'Accept',
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
      hasAtMostOneDiscussionLeft: true,
    });
  });

  test('returns hasSubmittedActionPlan: false when projectSubmission is empty', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Participant', projectSubmission: [],
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toMatchObject({ status: 'action-plan-pending', hasSubmittedActionPlan: false });
  });

  test('returns is-facilitator for non-FOAI Facilitators', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Facilitator',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'is-facilitator' });
  });

  test('returns not-eligible for an unrecognised meetPerson role', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', applicationsBaseRecordId: 'reg1', role: 'Observer',
    });

    const result = await createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });
    expect(result).toEqual({ status: 'not-eligible', hasUpcomingRounds: false });
  });

  // Attendance eligibility is judged on the discussions that have actually been held, so an
  // intensive round — six discussions inside a week — doesn't read as "missed five" on day one.
  describe('participant attendance', () => {
    const ONE_HOUR_SECONDS = 60 * 60;

    /**
     * Seeds an accepted participant whose expected discussions end at the given offsets in seconds
     * from now; negative offsets are discussions that have already happened, `null` is one that
     * hasn't been scheduled yet.
     */
    const seedParticipant = async ({
      endOffsets, attended, numUnits, lastDiscussionDate,
    }: {
      endOffsets?: (number | null)[];
      attended: number;
      numUnits: number;
      lastDiscussionDate: string;
    }) => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      await testDb.insert(courseRegistrationTable, {
        id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: 'rec-other', decision: 'Accept',
      });
      await testDb.insert(roundTable, { id: 'round1', lastDiscussionDate });

      const discussionIds = (endOffsets ?? []).map((_, index) => `disc-${index + 1}`);
      await Promise.all((endOffsets ?? []).map((offset, index) => testDb.insert(groupDiscussionTable, {
        id: discussionIds[index]!,
        group: 'group1',
        round: 'round1',
        startDateTime: nowSeconds + (offset ?? 0) - ONE_HOUR_SECONDS,
        endDateTime: offset == null ? null : nowSeconds + offset,
        facilitators: [],
        participantsExpected: ['mp1'],
      })));

      await testDb.insert(meetPersonTable, {
        id: 'mp1',
        applicationsBaseRecordId: 'reg1',
        role: 'Participant',
        round: 'round1',
        uniqueDiscussionAttendance: attended,
        numUnits,
        expectedDiscussionsParticipant: discussionIds,
      });
    };

    const getStatus = () => createCaller(testAuthContextLoggedIn).certificates.getStatus({ courseId: 'rec-other' });

    // The whole round falls inside the old seven-day window, so day one used to both accuse the
    // participant of missing five discussions and nudge them for an action plan.
    test('does not report a shortfall or nudge for an action plan on day one of an intensive round', async () => {
      // Six daily discussions; the first has just ended and the participant attended it.
      await seedParticipant({
        endOffsets: [-ONE_HOUR_SECONDS, 23 * ONE_HOUR_SECONDS, 47 * ONE_HOUR_SECONDS, 71 * ONE_HOUR_SECONDS, 95 * ONE_HOUR_SECONDS, 119 * ONE_HOUR_SECONDS],
        attended: 1,
        numUnits: 6,
        lastDiscussionDate: '2999-01-01',
      });

      expect(await getStatus()).toMatchObject({
        status: 'action-plan-pending',
        hasAtMostOneDiscussionLeft: false,
      });
    });

    test('does not report a shortfall while more than one discussion is still to come', async () => {
      // Day three of six: three held, one attended — two missed, but three chances left.
      await seedParticipant({
        endOffsets: [-47 * ONE_HOUR_SECONDS, -23 * ONE_HOUR_SECONDS, -ONE_HOUR_SECONDS, 23 * ONE_HOUR_SECONDS, 47 * ONE_HOUR_SECONDS, 71 * ONE_HOUR_SECONDS],
        attended: 1,
        numUnits: 6,
        lastDiscussionDate: '2999-01-01',
      });

      expect(await getStatus()).toMatchObject({ status: 'action-plan-pending' });
    });

    test('reports attendance-ineligible once only the final discussion is left, counting held discussions', async () => {
      await seedParticipant({
        endOffsets: [-95 * ONE_HOUR_SECONDS, -71 * ONE_HOUR_SECONDS, -47 * ONE_HOUR_SECONDS, -23 * ONE_HOUR_SECONDS, -ONE_HOUR_SECONDS, 23 * ONE_HOUR_SECONDS],
        attended: 3,
        numUnits: 6,
        lastDiscussionDate: '2999-01-01',
      });

      expect(await getStatus()).toEqual({
        status: 'attendance-ineligible',
        uniqueDiscussionAttendance: 3,
        discussionsHeld: 5,
      });
    });

    test('still allows a certificate when only one held discussion was missed, and nudges for the action plan', async () => {
      await seedParticipant({
        endOffsets: [-95 * ONE_HOUR_SECONDS, -71 * ONE_HOUR_SECONDS, -47 * ONE_HOUR_SECONDS, -23 * ONE_HOUR_SECONDS, -ONE_HOUR_SECONDS, 23 * ONE_HOUR_SECONDS],
        attended: 4,
        numUnits: 6,
        lastDiscussionDate: '2999-01-01',
      });

      expect(await getStatus()).toMatchObject({
        status: 'action-plan-pending',
        hasAtMostOneDiscussionLeft: true,
      });
    });

    test('counts every held discussion once the round is over', async () => {
      await seedParticipant({
        endOffsets: [-6, -5, -4, -3, -2, -1].map((days) => days * 24 * ONE_HOUR_SECONDS),
        attended: 4,
        numUnits: 6,
        lastDiscussionDate: '2020-01-01',
      });

      expect(await getStatus()).toEqual({
        status: 'attendance-ineligible',
        uniqueDiscussionAttendance: 4,
        discussionsHeld: 6,
      });
    });

    test('treats unscheduled discussions as still to come', async () => {
      // Four held, two not yet scheduled: the shortfall isn't final even though four were missed.
      await seedParticipant({
        endOffsets: [-71 * ONE_HOUR_SECONDS, -47 * ONE_HOUR_SECONDS, -23 * ONE_HOUR_SECONDS, -ONE_HOUR_SECONDS, null, null],
        attended: 0,
        numUnits: 6,
        lastDiscussionDate: '2999-01-01',
      });

      expect(await getStatus()).toMatchObject({ status: 'action-plan-pending' });
    });

    // Registrations with no discussions linked (never assigned a group, or not yet synced) fall
    // back to comparing course totals, which only says anything once the round is over.
    test('falls back to course totals when no discussions are linked and the round is over', async () => {
      await seedParticipant({ attended: 3, numUnits: 5, lastDiscussionDate: '2020-01-01' });

      expect(await getStatus()).toEqual({
        status: 'attendance-ineligible',
        uniqueDiscussionAttendance: 3,
        discussionsHeld: 5,
      });
    });

    test('reports nothing when no discussions are linked and the round is still running', async () => {
      await seedParticipant({ attended: 0, numUnits: 5, lastDiscussionDate: '2999-01-01' });

      expect(await getStatus()).toMatchObject({
        status: 'action-plan-pending',
        hasAtMostOneDiscussionLeft: false,
      });
    });
  });
});

describe('issueFoaiCertificateIfComplete', () => {
  const FOAI_USER_ID = 'user-foai';

  const setupCompletedFoaiExercises = async () => {
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Core', title: 'Ex 1', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });
  };

  test('issues the certificate on the self-serve row only', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', userId: 'test-user', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await setupCompletedFoaiExercises();

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');

    const legacy = await testDb.get(courseRegistrationTable, { id: 'reg-foai' });
    expect(legacy.certificateId).toBeNull();
  });

  test('does nothing when no self-serve row exists', async () => {
    // Self-serve is authoritative post read-switch; a learner without a self-serve row can't be issued to.
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', userId: 'test-user', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await setupCompletedFoaiExercises();

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(false);

    const legacy = await testDb.get(courseRegistrationTable, { id: 'reg-foai' });
    expect(legacy.certificateId).toBeNull();
  });

  test('writes nothing when exercises are incomplete', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-foai', email: 'test@example.com', userId: 'test-user', courseId: FOAI_COURSE_ID, decision: 'Accept',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Core', title: 'Ex 1', exerciseNumber: '1',
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(false);

    const legacy = await testDb.get(courseRegistrationTable, { id: 'reg-foai' });
    expect(legacy.certificateId).toBeNull();
    expect(await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)).toEqual([]);
  });

  test('issues the certificate even when a Further or Maybe exercise is incomplete', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Core', title: 'Required', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });
    // Further/Maybe exercises with no completed response — must not block the certificate.
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-further', courseId: FOAI_COURSE_ID, status: 'Further', title: 'Further', exerciseNumber: '2',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-maybe', courseId: FOAI_COURSE_ID, status: 'Maybe', title: 'Maybe', exerciseNumber: '3',
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');
  });

  test('does not issue the certificate while a Core exercise is incomplete, and issues once it is completed', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-core', courseId: FOAI_COURSE_ID, status: 'Core', title: 'Core', exerciseNumber: '1',
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(false);

    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-core', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-core', response: 'done', completedAt: '2026-01-01',
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');
  });

  test('counts an autosaved non-empty free-text response as complete even without completedAt', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-text', courseId: FOAI_COURSE_ID, status: 'Core', type: 'Free text', title: 'Text', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-text', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-text', response: 'my typed answer', completedAt: null,
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(true);

    const [selfServe] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-1'));
    expect(selfServe?.certificateId).toBe('ss-1');
  });

  test('does not count a whitespace-only free-text response without completedAt', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-text', courseId: FOAI_COURSE_ID, status: 'Core', type: 'Free text', title: 'Text', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-text', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-text', response: '  \n ', completedAt: null,
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(false);
  });

  test('judges by the latest response row when duplicates exist: cleared latest answer blocks the certificate', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-text', courseId: FOAI_COURSE_ID, status: 'Core', type: 'Free text', title: 'Text', exerciseNumber: '1',
    });
    // Older duplicate row: substantive answer, explicitly completed
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-old', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-text', response: 'my typed answer', completedAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z',
    });
    // Latest row: answer cleared, not completed
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-new', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-text', response: '', completedAt: null, createdAt: '2026-01-02T00:00:00.000Z',
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(false);
  });

  test('does not count a multiple-choice response without completedAt (wrong answer)', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-1', userId: FOAI_USER_ID, courseId: FOAI_COURSE_ID, createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-mc', courseId: FOAI_COURSE_ID, status: 'Core', type: 'Multiple choice', title: 'MC', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-mc', userId: [FOAI_USER_ID], exerciseId: 'foai-ex-mc', response: 'Wrong option', completedAt: null,
    });

    expect(await issueFoaiCertificateIfComplete(FOAI_USER_ID)).toBe(false);
  });
});
