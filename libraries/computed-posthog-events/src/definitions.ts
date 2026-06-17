import {
  and, gte, isNotNull,
  courseRegistrationTable, selfServeCourseRegistrationTable,
  groupDiscussionTable, meetPersonTable,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { EventProjectionRule } from './core';

const filterGteOrNull = (col: PgColumn, sinceValue: number | string | undefined) => (
  sinceValue == null ? isNotNull(col) : and(isNotNull(col), gte(col, sinceValue))
);
const isoDateToEpochSeconds = (sinceIso?: string) => (sinceIso == null ? undefined : Math.floor(Date.parse(sinceIso) / 1000));

export const eventProjectionRules: EventProjectionRule[] = [
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
  {
    eventType: 'application_accepted',
    async calculateEvents(db, { since }) {
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(filterGteOrNull(courseRegistrationTable.pg.acceptedAt, since)); // acceptedAt is ISO text

      return rows.map((r) => ({
        internalUniqueKey: `accept:${r.id}`,
        distinctId: r.email,
        timestampMs: Date.parse(r.acceptedAt!),
        properties: { course: r.courseId, round: r.roundId },
      }));
    },
  },

  // TODO to application_submitted instead
  {
    eventType: 'discussion_attended',
    async calculateEvents(db, { since }) {
      const [discussions, people] = await Promise.all([
        db.pg.select().from(groupDiscussionTable.pg)
          .where(filterGteOrNull(groupDiscussionTable.pg.startDateTime, isoDateToEpochSeconds(since))),
        db.pg.select({ id: meetPersonTable.pg.id, email: meetPersonTable.pg.email }).from(meetPersonTable.pg),
      ]);
      const emailById = new Map(people.map((p) => [p.id, p.email]));
      return discussions.flatMap((r) => {
        const startMs = Number(r.startDateTime) * 1000; // epoch seconds -> ms (unit to confirm vs real data)
        return (r.attendees ?? []).map((participantId) => ({
          internalUniqueKey: `${r.id}:${participantId}`,
          distinctId: emailById.get(participantId) ?? null,
          timestampMs: startMs,
          properties: { discussion: r.id, participant: participantId },
        }));
      });
    },
  },
];
