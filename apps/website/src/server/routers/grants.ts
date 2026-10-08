import type { CareerTransitionGrant, CareerTransitionGrantApplication, PublishedRapidGrant } from '@bluedot/db';
import {
  careerTransitionGrantApplicationTable,
  careerTransitionGrantTable,
  grantProgramStatsTable,
  publishedRapidGrantTable,
} from '@bluedot/db';
import { z } from 'zod';
import db from '../../lib/api/db';
import { ONE_DAY_MS, ONE_HOUR_MS } from '../../lib/constants';
import { sanitizeUrl } from '../../lib/sanitizeUrl';
import { publicProcedure, router } from '../trpc';

export type GrantStats = {
  count: number;
  totalAmountUsd: number;
};

export type CareerTransitionGrantStats = GrantStats & {
  averageDaysToDecision: number | null;
};

export type RapidGrantStatsWithDecision = GrantStats & {
  /** Mean of the program averages weighted by the number of timed decisions. */
  averageDaysToDecision: number | null;
};

export type PublicRapidGrant = {
  granteeName: string;
  projectTitle: string;
  amountUsd: number | null;
  projectSummary?: string;
  link?: string;
  monthLabel?: string;
};

export type PublicCareerTransitionGrant = {
  granteeName: string;
  imageUrl?: string;
  /** Short bio, e.g. "Director of AI/ML at Syndigo. 7+ years deploying production ML." */
  bio?: string;
  /** What the grantee is doing with the grant, shown as a quote on their card. */
  grantPlan?: string;
  /** Optional LinkedIn or personal URL. When present the whole card links to it. */
  profileUrl?: string;
};

// Rounded mean of the time-to-decision day counts, over decided rows only.
// A row counts as decided when its formula column holds a finite, non-negative
// number — a genuine same-day (0) decision included. Undecided rows arrive as
// null (the Airtable `[*] Time to decision` formula is NaN until a decision date
// exists) and are dropped, never folded in as 0. The `>= 0` guard also rejects
// corrupt rows where a decision date was back-filled before the submission date.
// Null when no decided rows exist.
const averageDecisionDays = (rows: { timeToDecisionDays: number | null }[]): number | null => {
  const days = rows
    .map((row) => row.timeToDecisionDays)
    .filter((value): value is number => value != null && Number.isFinite(value) && value >= 0);
  return days.length ? Math.round(days.reduce((sum, value) => sum + value, 0) / days.length) : null;
};

// pgAirtable stores Airtable date columns as text; parse here and bucket
// undated rows at the end of the list (alphabetised) so that newest grants
// appear first without dropping legacy rows that haven't been backfilled.
const parseGrantDate = (value: string | null | undefined): Date | null => {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// en-US gives a consistent 3-letter month (Jan, Feb, ..., Sep, ..., Dec).
// en-GB renders September as "Sept" which breaks visual rhythm in the list.
const formatMonthLabel = (date: Date): string => date.toLocaleDateString('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const mapPublicRapidGrants = (all: PublishedRapidGrant[]): PublicRapidGrant[] => {
  const enriched = all
    .filter((grant) => grant.granteeName?.trim()
      && grant.projectTitle?.trim()
      && grant.amountUsd != null)
    .map((grant: PublishedRapidGrant) => {
      const date = parseGrantDate(grant.grantDate);
      const publicGrant: PublicRapidGrant = {
        granteeName: grant.granteeName!.trim(),
        projectTitle: grant.projectTitle!.trim(),
        amountUsd: grant.amountUsd ?? null,
        projectSummary: grant.projectSummary?.trim()
          ? grant.projectSummary.trim()
          : undefined,
        link: sanitizeUrl(grant.link),
        monthLabel: date ? formatMonthLabel(date) : undefined,
      };
      return { publicGrant, dateMs: date?.getTime() ?? null };
    });

  return enriched
    .sort((a, b) => {
      if (a.dateMs !== null && b.dateMs !== null) return b.dateMs - a.dateMs;
      if (a.dateMs !== null) return -1;
      if (b.dateMs !== null) return 1;
      return a.publicGrant.projectTitle.localeCompare(b.publicGrant.projectTitle);
    })
    .map(({ publicGrant }) => publicGrant);
};

const canPublishCareerTransitionGrant = (application: CareerTransitionGrantApplication, now: number): boolean => {
  if (application.status !== 'Approve' || application.publicSharing !== 'Can share publicly with my name') return false;

  // Airtable's date-only fields are normalized to UTC timestamps by the sync client.
  const startDate = z.union([z.string().date(), z.string().datetime()]).safeParse(application.startDate);
  if (!startDate.success) return false;

  // Grantees may still be employed before their transition. Without their timezone,
  // wait until the start day has ended in UTC-12 (anywhere on earth).
  const publishAt = Date.parse(`${startDate.data.slice(0, 10)}T00:00:00Z`) + ONE_DAY_MS + 12 * ONE_HOUR_MS;
  return now >= publishAt;
};

const mapPublicCareerTransitionGrants = (all: CareerTransitionGrant[]): PublicCareerTransitionGrant[] => {
  const enriched = all
    .filter((grant) => Boolean(grant.firstName?.trim()) && Boolean(grant.lastName?.trim()))
    .map((grant: CareerTransitionGrant) => {
      // Formula concatenates up to 5 permanent URLs space-separated; take the first.
      const firstImageUrl = grant.imageUrl?.trim().split(/\s+/)[0] ?? null;
      const publicGrant: PublicCareerTransitionGrant = {
        granteeName: [grant.firstName?.trim(), grant.lastName?.trim()].filter(Boolean).join(' '),
        imageUrl: sanitizeUrl(firstImageUrl),
        bio: grant.bio?.trim() ? grant.bio.trim() : undefined,
        grantPlan: grant.grantPlan?.trim() ? grant.grantPlan.trim() : undefined,
        profileUrl: sanitizeUrl(grant.profileUrl),
      };
      return { publicGrant, dateMs: parseGrantDate(grant.grantApprovalDate)?.getTime() ?? null };
    });

  return enriched
    .filter(({ publicGrant }) => Boolean(publicGrant.imageUrl))
    .sort((a, b) => {
      if (a.dateMs !== null && b.dateMs !== null && a.dateMs !== b.dateMs) return b.dateMs - a.dateMs;
      if (a.dateMs !== null && b.dateMs === null) return -1;
      if (a.dateMs === null && b.dateMs !== null) return 1;
      return a.publicGrant.granteeName.localeCompare(b.publicGrant.granteeName);
    })
    .map(({ publicGrant }) => publicGrant);
};

export const grantsRouter = router({
  getAllPublicRapidGrantees: publicProcedure.query(async (): Promise<PublicRapidGrant[]> => {
    const all = await db.scan(publishedRapidGrantTable);
    return mapPublicRapidGrants(all);
  }),

  getAllPublicCareerTransitionGrantees: publicProcedure.query(async (): Promise<PublicCareerTransitionGrant[]> => {
    const [all, applications] = await Promise.all([
      db.scan(careerTransitionGrantTable),
      db.scan(careerTransitionGrantApplicationTable),
    ]);
    const now = Date.now();
    const publishableApplicationIds = new Set(applications
      .filter((application) => canPublishCareerTransitionGrant(application, now))
      .map((application) => application.id));
    return mapPublicCareerTransitionGrants(all.filter((grant) => grant.applicationId
      && publishableApplicationIds.has(grant.applicationId)));
  }),

  getRapidGrantStats: publicProcedure.query(async (): Promise<RapidGrantStatsWithDecision | null> => {
    // Synced program IDs stay stable when program names change. Include Events RFE
    // alongside Rapid Grants; the aggregates cover each program's full history.
    const programs = await db.scan(grantProgramStatsTable, {
      OR: [{ id: 'recOrUgz1rbHJt40w' }, { id: 'recxYhu9AmnAfP1NX' }],
    });
    // An incomplete sync must not appear as zero funding or omit a sub-program.
    if (programs.length !== 2 || programs.some((program) => program.approvedCount == null
      || program.awardedAmountUsd == null)) return null;

    const timingComplete = programs.every(({ timedDecisionCount, averageDaysToDecision }) => timedDecisionCount != null
      && Number.isInteger(timedDecisionCount) && timedDecisionCount >= 0
      && (timedDecisionCount === 0 || (averageDaysToDecision != null
        && Number.isFinite(averageDaysToDecision) && averageDaysToDecision >= 0)));
    const timedDecisionCount = programs.reduce((sum, program) => sum + (program.timedDecisionCount ?? 0), 0);
    const totalDecisionDays = programs.reduce((sum, program) => sum
      + (program.averageDaysToDecision ?? 0) * (program.timedDecisionCount ?? 0), 0);

    return {
      count: programs.reduce((sum, program) => sum + program.approvedCount!, 0),
      totalAmountUsd: programs.reduce((sum, program) => sum + program.awardedAmountUsd!, 0),
      averageDaysToDecision: timingComplete && timedDecisionCount > 0 ? totalDecisionDays / timedDecisionCount : null,
    };
  }),

  // Master CTG table carries every status — count + funding-awarded filter to granted
  // statuses; avg-days-to-decision averages every decided application (any row whose
  // [*] Time to decision formula has resolved to a number, same-day 0s included).
  getCareerTransitionGrantStats: publicProcedure.query(async (): Promise<CareerTransitionGrantStats> => {
    const all = await db.scan(careerTransitionGrantApplicationTable);
    const granted = all.filter((g) => g.status === 'Approve');
    return {
      count: granted.length,
      totalAmountUsd: granted.reduce((sum, g) => sum + (g.grantAmountUsd ?? 0), 0),
      averageDaysToDecision: averageDecisionDays(all),
    };
  }),
});
