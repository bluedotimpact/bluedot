import type { Grant } from '@bluedot/db';
import { grantTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export type PublicGrant = {
  granteeName: string;
  projectTitle: string;
  amountUsd: number | null;
  projectSummary?: string;
  link?: string;
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

const mapPublicGrants = (all: Grant[]): PublicGrant[] => {
  return all
    .filter((grant) => grant.granteeName?.trim()
      && grant.projectTitle?.trim())
    .map((grant: Grant) => ({
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

export const grantsRouter = router({
  getAllPublicGrantees: publicProcedure.query(async (): Promise<PublicGrant[]> => {
    const all = await db.scan(grantTable);
    return mapPublicGrants(all);
  }),
});
