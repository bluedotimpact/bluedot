import { useLatestUtmParams } from '@bluedot/ui';
import { buildApplicationUrl } from '../utils';
import { trpc } from '../../utils/trpc';
import { type GrantTypeSlug } from '../grantTypes';

/** Slugs of Airtable `program` rows whose application form link a page shows. */
export type ApplicationSlug = GrantTypeSlug | 'incubator-week' | 'fieldbuilder-week' | 'context-week';

export const useApplicationUrl = (slug: ApplicationSlug): string | undefined => {
  const { data } = trpc.programs.getBySlug.useQuery({ slug });
  const { latestUtmParams } = useLatestUtmParams();

  const applicationUrl = data?.applicationForm;
  if (!applicationUrl) return undefined;

  return buildApplicationUrl(applicationUrl, latestUtmParams);
};
