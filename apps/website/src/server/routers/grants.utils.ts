export type PublicGrantGrantee = {
  name: string;
  projectName: string;
  amountUsd: number | null;
  projectSummary?: string;
  profileOrProjectUrl?: string;
};

export type GrantGranteeRow = {
  name: string | null;
  projectName: string | null;
  amountUsd: number | null;
  projectSummary: string | null;
  profileOrProjectUrl: string | null;
};

const sanitizePublicGrantUrl = (value: string | null): string | undefined => {
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

export const mapPublicGrantGrantees = (all: GrantGranteeRow[]): PublicGrantGrantee[] => {
  return all
    .filter((grantee) => grantee.name?.trim()
      && grantee.projectName?.trim())
    .map((grantee) => ({
      name: grantee.name!.trim(),
      projectName: grantee.projectName!.trim(),
      amountUsd: grantee.amountUsd ?? null,
      projectSummary: grantee.projectSummary?.trim()
        ? grantee.projectSummary.trim()
        : undefined,
      profileOrProjectUrl: sanitizePublicGrantUrl(grantee.profileOrProjectUrl),
    }))
    .sort((a, b) => a.projectName.localeCompare(b.projectName));
};
