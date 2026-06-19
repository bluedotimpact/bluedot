import {
  and, gte, isNotNull, inArray,
  courseRegistrationTable, selfServeCourseRegistrationTable, courseTable,
  groupDiscussionTable, meetPersonTable, roundTable, unitTable, exerciseTable, exerciseResponsePgTable,
  type PgAirtableDb,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { Event, EventProjectionRule } from './core';

const filterGteOrNull = (col: PgColumn, sinceValue: number | string | undefined) => (
  sinceValue == null ? isNotNull(col) : and(isNotNull(col), gte(col, sinceValue))
);
const isoDateToEpochSeconds = (sinceIso?: string) => (sinceIso == null ? undefined : Math.floor(Date.parse(sinceIso) / 1000));

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

export const eventProjectionRules: EventProjectionRule[] = [
  {
    eventType: 'application_submitted',
    async calculateEvents(db, { since }) {
      const courses = await db.pg.select({ id: courseTable.pg.id, title: courseTable.pg.title }).from(courseTable.pg);
      const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.createdAt, since)); // createdAt is ISO text

      const trackEvents = rows.map((r) => {
        const courseName = courseTitleById.get(r.courseId);
        return {
          internalUniqueKey: r.id,
          distinctId: r.email,
          timestampMs: Date.parse(r.createdAt!),
          properties: {
            course_id: r.courseId,
            ...(courseName ? { course_name: courseName } : {}),
            ...(r.roundId ? { round_id: r.roundId } : {}),
            ...(r.roundName ? { round_name: r.roundName } : {}),
            // $session_id is PostHog's reserved key for session stitching; only set when we captured one.
            ...(r.posthogSessionId ? { $session_id: r.posthogSessionId } : {}),
          },
        };
      });

      // Where we captured the applicant's anonymous PostHog id, identify them: merge that anonymous
      // person into the email person so their pre-application browsing is attributed to them.
      const anonUsers = rows.filter((r) => r.posthogDistinctId && r.posthogDistinctId !== r.email);
      const identifyEvents = anonUsers.map((r) => ({
        type: 'identify' as const,
        internalUniqueKey: r.id,
        distinctId: r.email,
        anonDistinctId: r.posthogDistinctId!,
        timestampMs: Date.parse(r.createdAt!),
        set: { email: r.email },
      }));

      return [...identifyEvents, ...trackEvents];
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
      const responses = await db.pg.select().from(exerciseResponsePgTable)
        .where(filterGteOrNull(exerciseResponsePgTable.completedAt, since)); // completedAt is ISO text
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
];
