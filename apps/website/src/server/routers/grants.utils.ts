export type PublicGrant = {
  granteeName: string;
  projectTitle: string;
  amountUsd: number | null;
  projectSummary?: string;
  link?: string;
};

export type GrantRow = {
  granteeName: string | null;
  projectTitle: string | null;
  amountUsd: number | null;
  projectSummary: string | null;
  link: string | null;
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

export const mapPublicGrants = (all: GrantRow[]): PublicGrant[] => {
  return all
    .filter((grant) => grant.granteeName?.trim()
      && grant.projectTitle?.trim())
    .map((grant) => ({
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
