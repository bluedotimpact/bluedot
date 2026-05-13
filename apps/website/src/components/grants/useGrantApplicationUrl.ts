import { useLatestUtmParams } from '@bluedot/ui';
import { buildApplicationUrl } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { type ConfigurableGrantProgramSlug } from './grantPrograms';

export const useGrantApplicationUrl = (program: ConfigurableGrantProgramSlug): string | undefined => {
  const { data: programs } = trpc.programs.getAll.useQuery();
  const { latestUtmParams } = useLatestUtmParams();

  const applicationUrl = programs?.find((p) => p.slug === program)?.applicationForm;
  if (!applicationUrl) return undefined;

  return buildApplicationUrl(applicationUrl, latestUtmParams.utm_source);
};
