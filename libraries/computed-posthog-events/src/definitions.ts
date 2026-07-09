import {
  and, eq, gte, isNotNull, inArray,
  courseRegistrationTable, selfServeCourseRegistrationTable, courseTable,
  groupDiscussionTable, meetPersonTable, roundTable, unitTable, exerciseTable, exerciseResponsePgTable,
  unitResourceTable, resourceCompletionPgTable, projectSubmissionTable, dropoutTable, userTable,
  type PgAirtableDb,
  type CourseRegistration,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { Event, EventProjectionRule } from './core';

const filterGteOrNull = (col: PgColumn, sinceValue: number | string | undefined) => (
  sinceValue == null ? isNotNull(col) : and(isNotNull(col), gte(col, sinceValue))
);
const isoDateToEpochSeconds = (sinceIso?: string) => (sinceIso == null ? undefined : Math.floor(Date.parse(sinceIso) / 1000));

// Use the captured distinctId from the browser session if we have it, otherwise fall back to record id
const courseRegistrationAnonDistinctId = (r: Pick<CourseRegistration, 'id' | 'posthogDistinctId'>) => (
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  r.posthogDistinctId || r.id
);

// Mirrors the my-courses UI (deriveStatus in useDiscussionActions.tsx): a participant is `attended` when
// their meet_person id is in the discussion's attendees, and `absent` once the discussion has ended without it.
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const calculateDiscussionAttendanceEvents = async (
  db: PgAirtableDb,
  { since, now }: { since?: string; now?: string },
  kind: 'attended' | 'absent',
): Promise<Event[]> => {
  const nowMs = now ? Date.parse(now) : Date.now();
  // discussion datetimes are epoch seconds; `since` bounds work only — the emitted-events log keeps delivery send-once.
  const discussions = await db.pg.select().from(groupDiscussionTable.pg)
    .where(filterGteOrNull(groupDiscussionTable.pg.endDateTime, isoDateToEpochSeconds(since)));

  const meetPersonIds = [...new Set(discussions.flatMap((d) => d.participantsExpected ?? []))];
  if (meetPersonIds.length === 0) return [];
  const meetPersons = await db.pg.select().from(meetPersonTable.pg).where(inArray(meetPersonTable.pg.id, meetPersonIds));
  const meetPersonById = new Map(meetPersons.map((mp) => [mp.id, mp] as const));

  const roundIds = [...new Set(meetPersons.map((mp) => mp.round).filter((r): r is string => !!r))];
  const rounds = roundIds.length
    ? await db.pg.select({ id: roundTable.pg.id, title: roundTable.pg.title }).from(roundTable.pg).where(inArray(roundTable.pg.id, roundIds))
    : [];
  const roundTitleById = new Map(rounds.map((r) => [r.id, r.title] as const));

  const unitIds = [...new Set(discussions.map((d) => d.courseBuilderUnitRecordId).filter((u): u is string => !!u))];
  const units = unitIds.length
    ? await db.pg.select().from(unitTable.pg).where(inArray(unitTable.pg.id, unitIds))
    : [];
  const unitById = new Map(units.map((u) => [u.id, u] as const));

  const events: Event[] = [];
  for (const d of discussions) {
    // absent only materialises once a discussion has comfortably ended; attended emits as soon as recorded.
    const hasEnded = d.endDateTime * 1000 <= nowMs - FIFTEEN_MINUTES_MS;
    if (kind === 'absent' && !hasEnded) continue;

    const attendedSet = new Set(d.attendees ?? []);
    const unit = d.courseBuilderUnitRecordId ? unitById.get(d.courseBuilderUnitRecordId) : undefined;
    const unitNumber = d.unitNumber ?? (unit ? Number(unit.unitNumber) : null);
    const unitName = unit?.title ?? d.unitFallback ?? null;

    for (const meetPersonId of d.participantsExpected ?? []) {
      const isAttended = attendedSet.has(meetPersonId);
      if (kind === 'attended' ? !isAttended : isAttended) continue;

      const meetPerson = meetPersonById.get(meetPersonId);
      if (!meetPerson?.email) continue;
      const roundName = meetPerson.round ? roundTitleById.get(meetPerson.round) : undefined;

      events.push({
        internalUniqueKey: `${meetPersonId}:${d.id}`,
        distinctId: meetPerson.email,
        timestampMs: d.startDateTime * 1000,
        properties: {
          discussion_id: d.id,
          ...(unit ? { course_id: unit.courseId, course_name: unit.courseTitle, course_slug: unit.courseSlug } : {}),
          ...(meetPerson.round ? { round_id: meetPerson.round } : {}),
          ...(roundName ? { round_name: roundName } : {}),
          ...(unitNumber != null && Number.isFinite(unitNumber) ? { unit_number: unitNumber } : {}),
          ...(unitName ? { unit_name: unitName } : {}),
          ...(d.group ? { group_id: d.group } : {}),
          // total discussions in the course (attendance denominator: certificate needs all but one)
          ...(meetPerson.numUnits != null ? { num_discussions: meetPerson.numUnits } : {}),
        },
      });
    }
  }

  return events;
};

const calculateDropoutEvents = async (
  db: PgAirtableDb,
  { since }: { since?: string },
  type: 'Drop out' | 'Deferral',
): Promise<Event[]> => {
  // createdAt is Airtable's createdTime: set once when the dropout row is created, immutable.
  const rows = await db.pg.select().from(dropoutTable.pg)
    .where(and(filterGteOrNull(dropoutTable.pg.createdAt, since), eq(dropoutTable.pg.type, type)));
  if (rows.length === 0) return [];

  // Identity, course and round come off the linked application, not the dropout table's own email lookup.
  const registrationIds = [...new Set(rows.flatMap((r) => r.applicantId ?? []))];
  const registrations = registrationIds.length
    ? await db.pg.select({
      id: courseRegistrationTable.pg.id,
      email: courseRegistrationTable.pg.email,
      courseId: courseRegistrationTable.pg.courseId,
      roundId: courseRegistrationTable.pg.roundId,
      roundName: courseRegistrationTable.pg.roundName,
    }).from(courseRegistrationTable.pg).where(inArray(courseRegistrationTable.pg.id, registrationIds))
    : [];
  const registrationById = new Map(registrations.map((r) => [r.id, r] as const));

  const courses = registrations.length
    ? await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg)
    : [];
  const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));

  return rows.map((row) => {
    const registration = row.applicantId?.[0] ? registrationById.get(row.applicantId[0]) : undefined;
    const courseName = registration?.courseId ? courseTitleById.get(registration.courseId) : undefined;
    return {
      internalUniqueKey: row.id,
      distinctId: registration?.email ?? null,
      timestampMs: Date.parse(row.createdAt!),
      properties: {
        ...(registration?.courseId ? { course_id: registration.courseId } : {}),
        ...(courseName ? { course_name: courseName } : {}),
        ...(registration?.roundId ? { round_id: registration.roundId } : {}),
        ...(registration?.roundName ? { round_name: registration.roundName } : {}),
      },
    };
  });
};

export const eventProjectionRules: EventProjectionRule[] = [
  {
    eventType: 'application_submitted',
    async calculateEvents(db, { since }) {
      const courses = await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.createdAt, since)); // createdAt is ISO text

      return rows.map((r) => {
        const courseName = courseTitleById.get(r.courseId);
        return {
          internalUniqueKey: r.id,
          // Emitted under a deterministic anonymous distinct id, so it can later be joined up to
          // the user when they log in (via identify_applicants)
          distinctId: courseRegistrationAnonDistinctId(r),
          timestampMs: Date.parse(r.createdAt!),
          properties: {
            course_id: r.courseId,
            ...(courseName ? { course_name: courseName } : {}),
            ...(r.roundId ? { round_id: r.roundId } : {}),
            ...(r.roundName ? { round_name: r.roundName } : {}),
            // $session_id is PostHog's reserved key for session stitching; only set when we captured one.
            ...(r.posthogSessionId ? { $session_id: r.posthogSessionId } : {}),
            $set: { email: r.email },
          },
        };
      });
    },
  },
  {
    // Submit an `identify` event when we are able to join up an application to a logged in user.
    eventType: 'identify_applicants',
    async calculateEvents(db, { since }) {
      const [newRegistrations, newUsers] = await Promise.all([
        db.pg.select().from(courseRegistrationTable.pg).where(filterGteOrNull(courseRegistrationTable.pg.createdAt, since)),
        // strict gte: never-logged-in users have a NULL firstLoggedInAt and must not match every scan
        db.pg.select().from(userTable.pg)
          .where(since == null ? isNotNull(userTable.pg.firstLoggedInAt) : gte(userTable.pg.firstLoggedInAt, since)),
      ]);

      // Load both newly logged in users (which may match an existing registration) and newly created
      // registrations (which may match an existing user).
      const emails = [...new Set([...newRegistrations, ...newUsers].map((row) => row.email))];
      if (emails.length === 0) return [];
      const [registrations, users] = await Promise.all([
        db.pg.select().from(courseRegistrationTable.pg).where(inArray(courseRegistrationTable.pg.email, emails)),
        db.pg.select().from(userTable.pg).where(and(isNotNull(userTable.pg.firstLoggedInAt), inArray(userTable.pg.email, emails))),
      ]);

      // Earliest login wins when an email maps to multiple users, so the merge target is deterministic.
      const userByEmail = new Map<string, typeof users[number]>();
      for (const user of users) {
        const existing = userByEmail.get(user.email);
        if (!existing || user.firstLoggedInAt! < existing.firstLoggedInAt!) userByEmail.set(user.email, user);
      }

      return registrations.flatMap((registration): Event[] => {
        const user = userByEmail.get(registration.email);
        if (!user) return []; // no account yet, the application stays anonymous

        return [{
          type: 'identify',
          internalUniqueKey: `identify_applicants:${registration.id}`,
          distinctId: user.email,
          anonDistinctId: courseRegistrationAnonDistinctId(registration),
          timestampMs: Date.parse(user.firstLoggedInAt!),
          set: { email: user.email },
        }];
      });
    },
  },
  {
    eventType: 'application_accepted',
    async calculateEvents(db, { since }) {
      const courses = await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.acceptedAt, since)); // acceptedAt is ISO text

      return rows.map((r) => {
        const courseName = courseTitleById.get(r.courseId);
        return {
          internalUniqueKey: `accept:${r.id}`,
          distinctId: r.email,
          timestampMs: Date.parse(r.acceptedAt!),
          properties: {
            course_id: r.courseId,
            ...(courseName ? { course_name: courseName } : {}),
            ...(r.roundId ? { round_id: r.roundId } : {}),
            ...(r.roundName ? { round_name: r.roundName } : {}),
          },
        };
      });
    },
  },
  {
    eventType: 'application_rejected',
    async calculateEvents(db, { since }) {
      const courses = await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.rejectedAt, since)); // rejectedAt is ISO text

      return rows.map((r) => {
        const courseName = courseTitleById.get(r.courseId);
        return {
          internalUniqueKey: `reject:${r.id}`,
          distinctId: r.email,
          timestampMs: Date.parse(r.rejectedAt!),
          properties: {
            course_id: r.courseId,
            ...(courseName ? { course_name: courseName } : {}),
            ...(r.roundId ? { round_id: r.roundId } : {}),
            ...(r.roundName ? { round_name: r.roundName } : {}),
          },
        };
      });
    },
  },
  {
    eventType: 'application_withdrawn',
    async calculateEvents(db, { since }) {
      const courses = await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.withdrawnAt, since)); // withdrawnAt is ISO text

      return rows.map((r) => {
        const courseName = courseTitleById.get(r.courseId);
        return {
          internalUniqueKey: `withdraw:${r.id}`,
          distinctId: r.email,
          timestampMs: Date.parse(r.withdrawnAt!),
          properties: {
            course_id: r.courseId,
            ...(courseName ? { course_name: courseName } : {}),
            ...(r.roundId ? { round_id: r.roundId } : {}),
            ...(r.roundName ? { round_name: r.roundName } : {}),
          },
        };
      });
    },
  },
  {
    eventType: 'certificate_issued',
    async calculateEvents(db, { since }) {
      const sinceEpochSeconds = isoDateToEpochSeconds(since); // certificateCreatedAt is epoch seconds in both tables
      const courses = await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const facilitated = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.certificateCreatedAt, sinceEpochSeconds));
      const selfServe = await db.pg.select().from(selfServeCourseRegistrationTable.pg)
        .where(filterGteOrNull(selfServeCourseRegistrationTable.pg.certificateCreatedAt, sinceEpochSeconds));

      return [
        ...facilitated.filter((r) => r.certificateId != null).map((r) => {
          const courseName = courseTitleById.get(r.courseId);
          return {
            internalUniqueKey: `courseReg:${r.id}`,
            distinctId: r.email,
            timestampMs: Number(r.certificateCreatedAt) * 1000,
            properties: {
              course_id: r.courseId,
              ...(courseName ? { course_name: courseName } : {}),
              ...(r.roundId ? { round_id: r.roundId } : {}),
              ...(r.roundName ? { round_name: r.roundName } : {}),
              certificate_id: r.certificateId,
            },
          };
        }),
        ...selfServe.filter((r) => r.certificateId != null).map((r) => {
          const courseName = courseTitleById.get(r.courseId);
          return {
            internalUniqueKey: `selfServe:${r.id}`,
            distinctId: r.email,
            timestampMs: Number(r.certificateCreatedAt) * 1000,
            // self-serve has no round
            properties: {
              course_id: r.courseId,
              ...(courseName ? { course_name: courseName } : {}),
              certificate_id: r.certificateId,
            },
          };
        }),
      ];
    },
  },
  {
    eventType: 'discussion_attended',
    calculateEvents: (db, opts) => calculateDiscussionAttendanceEvents(db, opts, 'attended'),
  },
  {
    eventType: 'discussion_absent',
    calculateEvents: (db, opts) => calculateDiscussionAttendanceEvents(db, opts, 'absent'),
  },
  {
    eventType: 'exercise_completed',
    async calculateEvents(db, { since }) {
      const responses = await db.pg.select().from(exerciseResponsePgTable.pg)
        .where(filterGteOrNull(exerciseResponsePgTable.pg.completedAt, since)); // completedAt is ISO text
      if (responses.length === 0) return [];

      const [courses, exercises] = await Promise.all([
        db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg),
        db.pg.select({
          id: exerciseTable.pg.id, courseId: exerciseTable.pg.courseId, title: exerciseTable.pg.title,
          type: exerciseTable.pg.type, unitId: exerciseTable.pg.unitId,
        }).from(exerciseTable.pg),
      ]);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const exerciseById = new Map(exercises.map((e) => [e.id, e]));

      return responses.map((r) => {
        const exercise = exerciseById.get(r.exerciseId);
        const courseName = exercise?.courseId ? courseTitleById.get(exercise.courseId) : undefined;
        return {
          internalUniqueKey: r.id,
          distinctId: r.email,
          // Note: completedAt is mutable (can un-complete and re-complete), the event will
          // capture the *first time* we saw the response in a completed state
          timestampMs: Date.parse(r.completedAt!),
          properties: {
            exercise_id: r.exerciseId,
            ...(exercise?.title ? { exercise_name: exercise.title } : {}),
            ...(exercise?.type ? { exercise_type: exercise.type } : {}),
            ...(exercise?.unitId ? { unit_id: exercise.unitId } : {}),
            ...(exercise?.courseId ? { course_id: exercise.courseId } : {}),
            ...(courseName ? { course_name: courseName } : {}),
          },
        };
      });
    },
  },
  {
    eventType: 'resource_completed',
    async calculateEvents(db, { since }) {
      const completions = await db.pg.select().from(resourceCompletionPgTable.pg)
        .where(filterGteOrNull(resourceCompletionPgTable.pg.completedAt, since)); // completedAt is ISO text
      if (completions.length === 0) return [];

      const [unitResources, units] = await Promise.all([
        db.pg.select({
          id: unitResourceTable.pg.id, resourceName: unitResourceTable.pg.resourceName,
          unitId: unitResourceTable.pg.unitId, coreFurtherMaybe: unitResourceTable.pg.coreFurtherMaybe,
        }).from(unitResourceTable.pg),
        db.pg.select({
          id: unitTable.pg.id, courseId: unitTable.pg.courseId, courseTitle: unitTable.pg.courseTitle,
          courseSlug: unitTable.pg.courseSlug, title: unitTable.pg.title, unitNumber: unitTable.pg.unitNumber,
        }).from(unitTable.pg),
      ]);
      const unitResourceById = new Map(unitResources.map((ur) => [ur.id, ur]));
      const unitById = new Map(units.map((u) => [u.id, u]));

      return completions
        .filter((c) => c.email) // a null distinctId can't be attributed in PostHog
        .map((c) => {
          const unitResource = c.unitResourceId ? unitResourceById.get(c.unitResourceId) : undefined;
          const unit = unitResource?.unitId ? unitById.get(unitResource.unitId) : undefined;
          const unitNumber = unit ? Number(unit.unitNumber) : null;
          return {
            internalUniqueKey: c.id,
            distinctId: c.email,
            // Note: completedAt is mutable (can un-complete and re-complete), the event will
            // capture the *first time* we saw the resource in a completed state
            timestampMs: Date.parse(c.completedAt!),
            properties: {
              ...(c.resourceId?.[0] ? { resource_id: c.resourceId[0] } : {}),
              ...(c.unitResourceId ? { unit_resource_id: c.unitResourceId } : {}),
              ...(unitResource?.resourceName ? { resource_name: unitResource.resourceName } : {}),
              ...(unitResource?.coreFurtherMaybe ? { core_further_maybe: unitResource.coreFurtherMaybe } : {}),
              ...(unitResource?.unitId ? { unit_id: unitResource.unitId } : {}),
              ...(unitNumber != null && Number.isFinite(unitNumber) ? { unit_number: unitNumber } : {}),
              ...(unit?.title ? { unit_name: unit.title } : {}),
              ...(unit ? { course_id: unit.courseId, course_name: unit.courseTitle, course_slug: unit.courseSlug } : {}),
            },
          };
        });
    },
  },
  {
    eventType: 'project_submitted',
    async calculateEvents(db, { since }) {
      // createdAt is Airtable's createdTime: set once when the submission row is created, immutable.
      const submissions = await db.pg.select().from(projectSubmissionTable.pg)
        .where(filterGteOrNull(projectSubmissionTable.pg.createdAt, since));
      if (submissions.length === 0) return [];

      // The form links each submission to a meet_person (participant). The email and the course/round
      // both come off that link: meetPerson.email is the distinct id; meetPerson.applicationsBaseRecordId
      // -> course_registration gives the course and round.
      const participantIds = [...new Set(submissions.flatMap((s) => s.participant ?? []))];
      const meetPersons = participantIds.length
        ? await db.pg.select({
          id: meetPersonTable.pg.id, email: meetPersonTable.pg.email, applicationsBaseRecordId: meetPersonTable.pg.applicationsBaseRecordId,
        }).from(meetPersonTable.pg).where(inArray(meetPersonTable.pg.id, participantIds))
        : [];
      const meetPersonById = new Map(meetPersons.map((m) => [m.id, m] as const));

      const registrationIds = [...new Set(meetPersons.map((m) => m.applicationsBaseRecordId).filter((id): id is string => !!id))];
      const registrations = registrationIds.length
        ? await db.pg.select({
          id: courseRegistrationTable.pg.id,
          courseId: courseRegistrationTable.pg.courseId,
          roundId: courseRegistrationTable.pg.roundId,
          roundName: courseRegistrationTable.pg.roundName,
        }).from(courseRegistrationTable.pg).where(inArray(courseRegistrationTable.pg.id, registrationIds))
        : [];
      const registrationById = new Map(registrations.map((r) => [r.id, r] as const));

      const courses = registrations.length
        ? await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg)
        : [];
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));

      // Group projects link several participants; emit one event per participant so each gets credited.
      return submissions.flatMap((s) => (s.participant ?? []).map((participantId) => {
        const meetPerson = meetPersonById.get(participantId);
        const registration = meetPerson?.applicationsBaseRecordId ? registrationById.get(meetPerson.applicationsBaseRecordId) : undefined;
        const courseName = registration?.courseId ? courseTitleById.get(registration.courseId) : undefined;
        return {
          internalUniqueKey: `${s.id}:${participantId}`,
          distinctId: meetPerson?.email ?? null,
          timestampMs: Date.parse(s.createdAt!),
          properties: {
            ...(registration?.courseId ? { course_id: registration.courseId } : {}),
            ...(courseName ? { course_name: courseName } : {}),
            ...(registration?.roundId ? { round_id: registration.roundId } : {}),
            ...(registration?.roundName ? { round_name: registration.roundName } : {}),
            ...(s.projectTitle ? { project_title: s.projectTitle } : {}),
            ...(s.link ? { project_url: s.link } : {}),
          },
        };
      }));
    },
  },
  {
    eventType: 'course_dropped_out',
    calculateEvents: (db, opts) => calculateDropoutEvents(db, opts, 'Drop out'),
  },
  {
    eventType: 'course_deferred',
    calculateEvents: (db, opts) => calculateDropoutEvents(db, opts, 'Deferral'),
  },
];
