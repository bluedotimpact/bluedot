import {
  and,
  applicationsRoundTable,
  courseRegistrationTable,
  courseTable,
  eq,
  type Group,
  type GroupDiscussion,
  groupDiscussionTable,
  groupTable,
  inArray,
  isNull,
  meetPersonTable,
  ne,
  or,
  roundTable,
  type Unit,
  unitTable,
} from '@bluedot/db';
import type { CourseListRowProps } from '../../components/my-courses/CourseListRow';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { getRescheduleEligibleUnits } from './group-switching';

export const myCoursesPageRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const { email } = ctx.auth;

    // Step 1: Fetch data
    const courseRegistrations = await db.pg
      .select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, email),
        or(
          // Happy path: role === 'Participant'
          ne(courseRegistrationTable.pg.role, 'Facilitator'),
          isNull(courseRegistrationTable.pg.role),
        ),
        or(
          // Happy path: decision === 'Accept'
          ne(courseRegistrationTable.pg.decision, 'Withdrawn'),
          isNull(courseRegistrationTable.pg.decision),
        ),
      ));

    if (courseRegistrations.length === 0) {
      return { courses: [], nextDiscussion: null };
    }

    // 1a: Fan-out fetch by id, all derived from courseRegistrations

    // courses + meetPersons.
    const courseIds = [...new Set(courseRegistrations.map((cr) => cr.courseId).filter((id): id is string => !!id))];

    const [courses, meetPersons] = await Promise.all([
      courseIds.length > 0
        // Only surface courses whose status is 'Active'. Archived/Past courses
        // have unmaintained course pages, so showing them in /my-courses funnels users into
        // broken areas of the site.
        ? db.pg.select().from(courseTable.pg).where(and(
          inArray(courseTable.pg.id, courseIds),
          eq(courseTable.pg.status, 'Active'),
        ))
        : Promise.resolve([]),
      db.pg.select().from(meetPersonTable.pg).where(eq(meetPersonTable.pg.email, email)),
    ]);

    // The user's own groups (needs meetPersons.groupsAsParticipant).
    const groupIds = [...new Set(meetPersons.flatMap((mp) => mp.groupsAsParticipant ?? []))];
    const groups: Group[] = groupIds.length > 0
      ? await db.pg.select().from(groupTable.pg).where(inArray(groupTable.pg.id, groupIds))
      : [];

    // Facilitators (from groups), discussions (from meetPersons), rounds (from regs).
    const facilitatorIds = [...new Set(groups.flatMap((g) => g.facilitator ?? []))];
    const allExpectedDiscussionIds = [...new Set(meetPersons.flatMap((mp) => mp.expectedDiscussionsParticipant ?? []))];
    const allRoundIds = [...new Set(courseRegistrations.map((cr) => cr.roundId).filter((id): id is string => !!id))];

    const [facilitators, discussions, roundRows] = await Promise.all([
      facilitatorIds.length > 0
        ? db.pg
          .select({
            id: meetPersonTable.pg.id,
            firstName: meetPersonTable.pg.firstName,
            lastName: meetPersonTable.pg.lastName,
          })
          .from(meetPersonTable.pg)
          .where(inArray(meetPersonTable.pg.id, facilitatorIds))
        : Promise.resolve([]),
      allExpectedDiscussionIds.length > 0
        ? db.pg
          .select()
          .from(groupDiscussionTable.pg)
          .where(inArray(groupDiscussionTable.pg.id, allExpectedDiscussionIds))
        : Promise.resolve([] as GroupDiscussion[]),
      allRoundIds.length > 0
        ? db.pg
          .select({
            id: applicationsRoundTable.pg.id,
            firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
            lastDiscussionDate: applicationsRoundTable.pg.lastDiscussionDate,
          })
          .from(applicationsRoundTable.pg)
          .where(inArray(applicationsRoundTable.pg.id, allRoundIds))
        : Promise.resolve([]),
    ]);

    // Units (from discussions) + round-wide groups/discussions/courseRounds (for reschedule eligibility — see Step 3).
    const unitIds = [...new Set(discussions.map((d) => d.courseBuilderUnitRecordId).filter((id): id is string => !!id))];
    const meetPersonRoundIds = [...new Set(meetPersons.map((mp) => mp.round).filter((r): r is string => !!r))];
    const [units, allGroupsInRounds, allDiscussionsInRounds, courseRoundsForCapacity] = await Promise.all([
      unitIds.length > 0
        ? db.pg.select().from(unitTable.pg).where(inArray(unitTable.pg.id, unitIds)) as Promise<Unit[]>
        : Promise.resolve([] as Unit[]),
      meetPersonRoundIds.length > 0
        ? db.pg.select().from(groupTable.pg).where(inArray(groupTable.pg.round, meetPersonRoundIds)) as Promise<Group[]>
        : Promise.resolve([] as Group[]),
      meetPersonRoundIds.length > 0
        ? db.pg.select().from(groupDiscussionTable.pg).where(inArray(groupDiscussionTable.pg.round, meetPersonRoundIds)) as Promise<GroupDiscussion[]>
        : Promise.resolve([] as GroupDiscussion[]),
      meetPersonRoundIds.length > 0
        ? db.pg
          .select({ id: roundTable.pg.id, maxParticipantsPerGroup: roundTable.pg.maxParticipantsPerGroup })
          .from(roundTable.pg)
          .where(inArray(roundTable.pg.id, meetPersonRoundIds))
        : Promise.resolve([] as { id: string; maxParticipantsPerGroup: number | null }[]),
    ]);

    // Step 2: Calculate synthetic results for main section
    // 2a: Calculate units eligible for rescheduling
    const unitsEligibleToRescheduleByMeetPersonId = new Map<string, Set<string>>();
    for (const mp of meetPersons) {
      if (!mp.round) continue;
      const groupsInRound = allGroupsInRounds.filter((g) => g.round === mp.round);
      const discussionsInRound = allDiscussionsInRounds.filter((d) => d.round === mp.round);
      const courseRound = courseRoundsForCapacity.find((r) => r.id === mp.round);
      unitsEligibleToRescheduleByMeetPersonId.set(mp.id, getRescheduleEligibleUnits({
        groups: groupsInRound,
        groupDiscussions: discussionsInRound,
        participantId: mp.id,
        participantHumanOpinion: mp.humanOpinion ?? null,
        maxParticipants: courseRound?.maxParticipantsPerGroup ?? null,
      }));
    }

    // 2b: Build one row per course registration.
    const facilitatorById = new Map(facilitators.map((f) => [f.id, f]));
    const unitById = new Map(units.map((u) => [u.id, u] as const));
    const discussionById = new Map(discussions.map((d) => [d.id, d] as const));
    const roundById = new Map(roundRows.map((r) => [r.id, r] as const));

    const perCourse: CourseListRowProps[] = courseRegistrations.flatMap((cr) => {
      const course = courses.find((c) => c.id === cr.courseId);
      if (!course) return [];

      const meetPerson = meetPersons.find((mp) => mp.applicationsBaseRecordId === cr.id);
      const groupId = meetPerson?.groupsAsParticipant?.[0];
      const group = groupId ? groups.find((g) => g.id === groupId) ?? null : null;
      const facilitatorNames = (group?.facilitator ?? [])
        .flatMap((id) => {
          const f = facilitatorById.get(id);
          if (!f) return [];
          const full = `${f.firstName ?? ''} ${f.lastName ?? ''}`.trim();
          return full ? [full] : [];
        });

      const expectedIds = meetPerson?.expectedDiscussionsParticipant ?? [];
      const courseDiscussions = expectedIds
        .map((id) => discussionById.get(id))
        .filter((d): d is GroupDiscussion => !!d)
        .sort((a, b) => a.startDateTime - b.startDateTime);

      const courseUnits: Record<string, Unit> = {};
      for (const d of courseDiscussions) {
        const unit = d.courseBuilderUnitRecordId ? unitById.get(d.courseBuilderUnitRecordId) : undefined;
        if (unit) courseUnits[d.id] = unit;
      }

      const rescheduleEligibleUnits = meetPerson
        ? Array.from(unitsEligibleToRescheduleByMeetPersonId.get(meetPerson.id) ?? [])
        : [];

      return [{
        courseRegistration: cr,
        course,
        group,
        facilitatorNames,
        meetPersonId: meetPerson?.id ?? null,
        groupsAsParticipant: meetPerson?.groupsAsParticipant ?? null,
        roundId: meetPerson?.round ?? cr.roundId ?? null,
        discussions: courseDiscussions,
        attendedDiscussionIds: meetPerson?.attendedDiscussions ?? [],
        units: courseUnits,
        roundStartDate: cr.roundId ? roundById.get(cr.roundId)?.firstDiscussionDate ?? null : null,
        roundEndDate: cr.roundId ? roundById.get(cr.roundId)?.lastDiscussionDate ?? null : null,
        rescheduleEligibleUnits,
        numUnits: meetPerson?.numUnits ?? null,
        uniqueDiscussionAttendance: meetPerson?.uniqueDiscussionAttendance ?? null,
        hasSubmittedActionPlan: (meetPerson?.projectSubmission?.length ?? 0) > 0,
        feedbackFormUrl: meetPerson?.courseFeedbackForm ?? null,
        hasSubmittedFeedback: (meetPerson?.courseFeedback?.length ?? 0) > 0,
      }];
    });

    // Step 3: Calculate results for NextDiscussionCard section
    const courseByDiscussionId = new Map<string, { slug: string; title: string }>();
    for (const c of perCourse) {
      const cr = c.courseRegistration;
      if (cr.dropoutId?.length && !cr.deferredId?.length) continue;
      for (const d of c.discussions) {
        courseByDiscussionId.set(d.id, { slug: c.course.slug, title: c.course.title });
      }
    }

    // "Next" includes a discussion that's started but not yet ended (i.e. live now)
    const nowSec = Math.floor(Date.now() / 1000);
    const soonest = discussions
      .filter((d) => d.endDateTime > nowSec)
      .sort((a, b) => a.startDateTime - b.startDateTime)
      .find((d) => courseByDiscussionId.has(d.id));

    let nextDiscussion: {
      courseSlug: string;
      courseTitle: string;
      discussion: GroupDiscussion;
      unit: Unit | null;
      group: Group | null;
    } | null = null;
    if (soonest) {
      const owningCourse = courseByDiscussionId.get(soonest.id);
      if (owningCourse) {
        nextDiscussion = {
          courseSlug: owningCourse.slug,
          courseTitle: owningCourse.title,
          discussion: soonest,
          unit: soonest.courseBuilderUnitRecordId ? unitById.get(soonest.courseBuilderUnitRecordId) ?? null : null,
          group: groups.find((g) => g.id === soonest.group) ?? null,
        };
      }
    }

    return { courses: perCourse, nextDiscussion };
  }),

  // Returns the people in the caller's group for a given meetPerson record. The caller must own
  // the meetPerson (verified via email match). Facilitators are returned first, then participants
  // alphabetically by name. Caller themselves are excluded from the list.
  getGroupParticipants: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const meetPersonRows = await db.pg.select()
        .from(meetPersonTable.pg)
        .where(eq(meetPersonTable.pg.id, input.meetPersonId));
      const callerMeetPerson = meetPersonRows[0];
      if (callerMeetPerson?.email !== ctx.auth.email) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'meetPerson not found' });
      }

      const groupId = callerMeetPerson.groupsAsParticipant?.[0];
      if (!groupId) return { facilitators: [], participants: [] };

      const groupRows = await db.pg.select().from(groupTable.pg).where(eq(groupTable.pg.id, groupId));
      const group = groupRows[0];
      if (!group) return { facilitators: [], participants: [] };

      const facilitatorIdsArr = group.facilitator ?? [];
      const participantIdsArr = (group.participants ?? []).filter((id) => id !== callerMeetPerson.id);
      const allIds = [...facilitatorIdsArr, ...participantIdsArr];
      if (allIds.length === 0) return { facilitators: [], participants: [] };

      const people = await db.pg
        .select({
          id: meetPersonTable.pg.id,
          name: meetPersonTable.pg.name,
        })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, allIds));
      const peopleById = new Map(people.map((p) => [p.id, { id: p.id, name: p.name ?? '' }]));

      const facilitators = facilitatorIdsArr
        .map((id) => peopleById.get(id))
        .filter((p): p is { id: string; name: string } => !!p)
        .sort((a, b) => a.name.localeCompare(b.name));
      const participants = participantIdsArr
        .map((id) => peopleById.get(id))
        .filter((p): p is { id: string; name: string } => !!p)
        .sort((a, b) => a.name.localeCompare(b.name));

      return { facilitators, participants };
    }),
});
