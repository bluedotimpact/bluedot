import {
  and, gte, isNotNull,
  courseRegistrationTable, selfServeCourseRegistrationTable,
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
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.createdAt, since)); // createdAt is ISO text

      return rows.map((r) => ({
        internalUniqueKey: r.id,
        distinctId: r.email,
        timestampMs: Date.parse(r.createdAt!),
        properties: {
          // TODO worth including readable values here, since it will be hard to re-look them up in posthog
          course: r.courseId,
          round: r.roundId,
          // $session_id is PostHog's reserved key for session stitching; only set when we captured one.
          ...(r.posthogSessionId ? { $session_id: r.posthogSessionId } : {}),
        },
      }));
    },
  },
  {
    eventType: 'application_accepted',
    async calculateEvents(db, { since }) {
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.acceptedAt, since)); // acceptedAt is ISO text

      return rows.map((r) => ({
        internalUniqueKey: `accept:${r.id}`,
        distinctId: r.email,
        timestampMs: Date.parse(r.acceptedAt!),
        // TODO worth including readable values
        properties: { course: r.courseId, round: r.roundId },
      }));
    },
  },
  {
    eventType: 'certificate_issued',
    async calculateEvents(db, { since }) {
      const sinceEpochSeconds = isoDateToEpochSeconds(since); // certificateCreatedAt is epoch seconds in both tables

      const [facilitated, selfServe] = await Promise.all([
        db.pg.select().from(courseRegistrationTable.pg)
          .where(filterGteOrNull(courseRegistrationTable.pg.certificateCreatedAt, sinceEpochSeconds)),
        db.pg.select().from(selfServeCourseRegistrationTable.pg)
          .where(filterGteOrNull(selfServeCourseRegistrationTable.pg.certificateCreatedAt, sinceEpochSeconds)),
      ]);

      return [
        ...facilitated.filter((r) => r.certificateId != null).map((r) => ({
          internalUniqueKey: `courseReg:${r.id}`,
          distinctId: r.email,
          timestampMs: Number(r.certificateCreatedAt) * 1000,
          // TODO worth including readable values
          properties: { course: r.courseId, round: r.roundId, certificate_id: r.certificateId },
        })),
        ...selfServe.filter((r) => r.certificateId != null).map((r) => ({
          internalUniqueKey: `selfServe:${r.id}`,
          distinctId: r.email,
          timestampMs: Number(r.certificateCreatedAt) * 1000,
          properties: { course: r.courseId, certificate_id: r.certificateId }, // self-serve has no round
        })),
      ];
    },
  },
];
