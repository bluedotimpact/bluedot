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
};

export type PublicCareerTransitionGrant = {
  granteeName: string;
  amountUsd: number | null;
  grantDuration?: string;
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

const mapPublicRapidGrants = (all: RapidGrant[]): PublicRapidGrant[] => {
  return all
    .filter((grant) => grant.granteeName?.trim()
      && grant.projectTitle?.trim())
    .map((grant: RapidGrant) => ({
      granteeName: grant.granteeName!.trim(),
      projectTitle: grant.projectTitle!.trim(),
      amountUsd: grant.amountUsd ?? null,
      projectSummary: grant.projectSummary?.trim()
        ? grant.projectSummary.trim()
        : undefined,
      link: sanitizeUrl(grant.link),
    }))
    .sort((a, b) => a.projectTitle.localeCompare(b.projectTitle));
};

const mapPublicCareerTransitionGrants = (all: CareerTransitionGrant[]): PublicCareerTransitionGrant[] => {
  return all
    .filter((grant) => Boolean(grant.firstName?.trim()) && Boolean(grant.lastName?.trim()))
    .map((grant: CareerTransitionGrant) => ({
      granteeName: [grant.firstName?.trim(), grant.lastName?.trim()].filter(Boolean).join(' '),
      amountUsd: grant.amountUsd ?? null,
      grantDuration: grant.grantDuration?.trim()
        ? grant.grantDuration.trim()
        : undefined,
    }))
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
