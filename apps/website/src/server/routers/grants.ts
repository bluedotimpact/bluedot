import type { CareerTransitionGrant, RapidGrant } from '@bluedot/db';
import {
  careerTransitionGrantApplicationTable,
  careerTransitionGrantTable,
  rapidGrantApplicationTable,
  rapidGrantTable,
} from '@bluedot/db';
import db from '../../lib/api/db';
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
  /** 10%-trimmed mean of decision hours (fastest 10% + slowest 10% dropped). Robust to long-tail outliers without losing the "average" framing applicants expect. Null when no decided rows exist. */
  averageHoursToDecision: number | null;
  /** 90th-percentile days from submission to decision, rounded up. Null when no decided rows exist. */
  p90DaysToDecision: number | null;
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

// Nearest-rank percentile on a numeric array. Sorts a copy so the caller's array isn't mutated.
// p must be in [0, 1]. Returns the value at index ceil(p * n) - 1, clamped to [0, n - 1].
const percentile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1));
  return sorted[index]!;
};

// Mean of the values after dropping the fastest and slowest `trimPct` from each end.
// For small n the floor() can leave cut=0 — that's fine; trimmed mean degrades gracefully
// to the arithmetic mean rather than producing a misleading value from too few rows.
const trimmedMean = (values: number[], trimPct: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * trimPct);
  const inner = sorted.slice(cut, sorted.length - cut);
  return inner.reduce((sum, v) => sum + v, 0) / inner.length;
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

const mapPublicRapidGrants = (all: RapidGrant[]): PublicRapidGrant[] => {
  const enriched = all
    .filter((grant) => grant.granteeName?.trim()
      && grant.projectTitle?.trim())
    .map((grant: RapidGrant) => {
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

const mapPublicCareerTransitionGrants = (all: CareerTransitionGrant[]): PublicCareerTransitionGrant[] => {
  return all
    .filter((grant) => Boolean(grant.firstName?.trim()) && Boolean(grant.lastName?.trim()))
    .map((grant: CareerTransitionGrant) => {
      // Formula concatenates up to 5 permanent URLs space-separated; take the first.
      const firstImageUrl = grant.imageUrl?.trim().split(/\s+/)[0] ?? null;
      return {
        granteeName: [grant.firstName?.trim(), grant.lastName?.trim()].filter(Boolean).join(' '),
        imageUrl: sanitizeUrl(firstImageUrl),
        bio: grant.bio?.trim() ? grant.bio.trim() : undefined,
        grantPlan: grant.grantPlan?.trim() ? grant.grantPlan.trim() : undefined,
        profileUrl: sanitizeUrl(grant.profileUrl),
      };
    })
    .sort((a, b) => a.granteeName.localeCompare(b.granteeName));
};

export const grantsRouter = router({
  getAllPublicRapidGrantees: publicProcedure.query(async (): Promise<PublicRapidGrant[]> => {
    const all = await db.scan(rapidGrantTable);
    return mapPublicRapidGrants(all);
  }),

  getAllPublicCareerTransitionGrantees: publicProcedure.query(async (): Promise<PublicCareerTransitionGrant[]> => {
    const all = await db.scan(careerTransitionGrantTable);
    return mapPublicCareerTransitionGrants(all);
  }),

  getRapidGrantStats: publicProcedure.query(async (): Promise<RapidGrantStatsWithDecision> => {
    const all = await db.scan(rapidGrantApplicationTable);
    // Scope to the current program launched 2025-06-01. pgAirtable does not support
    // timestamp columns, so createdAt is stored as text; parse to Date here so the
    // comparison is not a brittle string compare. Records with an unparseable value
    // (malformed or empty) are excluded.
    const programLaunch = new Date('2025-06-01T00:00:00Z');
    const inProgram = all.filter((g) => {
      if (!g.createdAt) return false;
      const createdAt = new Date(g.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= programLaunch;
    });
    const accepted = inProgram.filter((g) => g.grantDecision === 'Accept');
    // Decision times across every decided row (Accept + Reject + call), not just accepts —
    // the marketing claim is "we respond fast," which applies to all applicants.
    const decisionHours = inProgram
      .filter((g) => g.grantDecision && g.createdAt && g.decidedAt)
      .map((g) => {
        const createdMs = new Date(g.createdAt!).getTime();
        const decidedMs = new Date(g.decidedAt!).getTime();
        if (Number.isNaN(createdMs) || Number.isNaN(decidedMs) || decidedMs < createdMs) return null;
        return (decidedMs - createdMs) / 3_600_000;
      })
      .filter((h): h is number => h !== null);
    return {
      count: accepted.length,
      totalAmountUsd: accepted.reduce((sum, g) => sum + (g.grantedAmountUsd ?? 0), 0),
      averageHoursToDecision: decisionHours.length ? trimmedMean(decisionHours, 0.1) : null,
      p90DaysToDecision: decisionHours.length ? Math.ceil(percentile(decisionHours, 0.9) / 24) : null,
    };
  }),

  // Master CTG table carries every status — count + funding-awarded filter to granted
  // statuses, avg-days-to-decision averages all decided rows (rows where the
  // [*] Time to decision (days) formula yielded a positive integer).
  getCareerTransitionGrantStats: publicProcedure.query(async (): Promise<CareerTransitionGrantStats> => {
    const all = await db.scan(careerTransitionGrantApplicationTable);
    const granted = all.filter((g) => g.status === 'Approved' || g.status === 'Agreement signed');
    const decided = all.filter((g) => (g.timeToDecisionDays ?? 0) > 0);
    return {
      count: granted.length,
      totalAmountUsd: granted.reduce((sum, g) => sum + (g.grantAmountUsd ?? 0), 0),
      averageDaysToDecision: decided.length
        ? Math.round(decided.reduce((sum, g) => sum + (g.timeToDecisionDays ?? 0), 0) / decided.length)
        : null,
    };
  }),
});
