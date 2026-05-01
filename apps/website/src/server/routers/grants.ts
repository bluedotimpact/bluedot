import type { CareerTransitionGrant, RapidGrant } from '@bluedot/db';
import {
  careerTransitionGrantApplicationTable,
  careerTransitionGrantTable,
  rapidGrantApplicationTable,
  rapidGrantTable,
} from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export type GrantStats = {
  count: number;
  totalAmountUsd: number;
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

const sanitizeUrl = (value: string | null): string | undefined => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedValue);

    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
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

  getRapidGrantStats: publicProcedure.query(async (): Promise<GrantStats> => {
    const all = await db.scan(rapidGrantApplicationTable);
    // Scope to the current program launched 2025-06-01. pgAirtable does not support
    // timestamp columns, so createdAt is stored as text; parse to Date here so the
    // comparison is not a brittle string compare. Records with an unparseable value
    // (malformed or empty) are excluded.
    const programLaunch = new Date('2025-06-01T00:00:00Z');
    const accepted = all.filter((g) => {
      if (g.grantDecision !== 'Accept' || !g.createdAt) return false;
      const createdAt = new Date(g.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= programLaunch;
    });
    return {
      count: accepted.length,
      totalAmountUsd: accepted.reduce((sum, g) => sum + (g.grantedAmountUsd ?? 0), 0),
    };
  }),

  getCareerTransitionGrantStats: publicProcedure.query(async (): Promise<GrantStats> => {
    const all = await db.scan(careerTransitionGrantApplicationTable);
    const signed = all.filter((g) => g.evaluationStatus === 'Agreement signed');
    return {
      count: signed.length,
      totalAmountUsd: signed.reduce((sum, g) => sum + (g.grantAmountUsd ?? 0), 0),
    };
  }),
});
