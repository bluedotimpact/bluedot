import {
  and, gte, isNotNull,
  courseRegistrationTable, selfServeCourseRegistrationTable, courseTable,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { EventProjectionRule } from './core';

const filterGteOrNull = (col: PgColumn, sinceValue: number | string | undefined) => (
  sinceValue == null ? isNotNull(col) : and(isNotNull(col), gte(col, sinceValue))
);
const isoDateToEpochSeconds = (sinceIso?: string) => (sinceIso == null ? undefined : Math.floor(Date.parse(sinceIso) / 1000));

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
];
