import {
  and, gte, isNotNull,
  courseRegistrationTable, selfServeCourseRegistrationTable,
  groupDiscussionTable, meetPersonTable,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { Projection } from './core';

// Gate helpers: a column must be present, and (for incremental runs) >= `since`. The unit of
// `since` differs by column type — epoch-seconds numeric vs ISO text — so each definition converts.
const gatePresentSince = (col: PgColumn, sinceValue: number | string | undefined) => (
  sinceValue == null ? isNotNull(col) : and(isNotNull(col), gte(col, sinceValue))
);
const toEpochSeconds = (sinceMs?: number) => (sinceMs == null ? undefined : Math.floor(sinceMs / 1000));
const toIso = (sinceMs?: number) => (sinceMs == null ? undefined : new Date(sinceMs).toISOString());

export const projections: Projection[] = [
  {
    event: 'certificate_issued',
    async calculateEvents(db, { since }) {
      const s = toEpochSeconds(since); // certificateCreatedAt is epoch seconds in both tables
      const [facilitated, selfServe] = await Promise.all([
        db.pg.select().from(courseRegistrationTable.pg)
          .where(gatePresentSince(courseRegistrationTable.pg.certificateCreatedAt, s)),
        db.pg.select().from(selfServeCourseRegistrationTable.pg)
          .where(gatePresentSince(selfServeCourseRegistrationTable.pg.certificateCreatedAt, s)),
      ]);
      return [
        ...facilitated.filter((r) => r.certificateId != null).map((r) => ({
          key: `courseReg:${r.id}`,
          distinctId: r.email,
          timestampMs: Number(r.certificateCreatedAt) * 1000,
          properties: { course: r.courseId, round: r.roundId, certificate_id: r.certificateId },
        })),
        ...selfServe.filter((r) => r.certificateId != null).map((r) => ({
          key: `selfServe:${r.id}`,
          distinctId: r.email,
          timestampMs: Number(r.certificateCreatedAt) * 1000,
          properties: { course: r.courseId, certificate_id: r.certificateId }, // self-serve has no round
        })),
      ];
    },
  },

  // Gated on the write-once `Accepted at` field (stamped the first time Decision becomes Accept and
  // never moved). So the timestamp is stable and the event emits once, even if the Decision later flips.
  {
    event: 'application_accepted',
    async calculateEvents(db, { since }) {
      const rows = await db.pg.select().from(courseRegistrationTable.pg)
        .where(gatePresentSince(courseRegistrationTable.pg.acceptedAt, toIso(since))); // ISO text
      return rows.map((r) => ({
        key: `accept:${r.id}`,
        distinctId: r.email,
        timestampMs: Date.parse(r.acceptedAt!),
        properties: { course: r.courseId, round: r.roundId },
      }));
    },
  },

  // One row -> N events (attendee array), distinct_id resolved via an id->email map.
  {
    event: 'discussion_attended',
    async calculateEvents(db, { since }) {
      const [discussions, people] = await Promise.all([
        db.pg.select().from(groupDiscussionTable.pg)
          .where(gatePresentSince(groupDiscussionTable.pg.startDateTime, toEpochSeconds(since))),
        db.pg.select({ id: meetPersonTable.pg.id, email: meetPersonTable.pg.email }).from(meetPersonTable.pg),
      ]);
      const emailById = new Map(people.map((p) => [p.id, p.email]));
      return discussions.flatMap((r) => {
        const startMs = Number(r.startDateTime) * 1000; // epoch seconds -> ms (unit to confirm vs real data)
        return (r.attendees ?? []).map((participantId) => ({
          key: `${r.id}:${participantId}`,
          distinctId: emailById.get(participantId) ?? null,
          timestampMs: startMs,
          properties: { discussion: r.id, participant: participantId },
        }));
      });
    },
  },
];
