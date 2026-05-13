import { useLatestUtmParams } from '@bluedot/ui';
import { buildApplicationUrl } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { type ConfigurableGrantProgramSlug } from './grantPrograms';

export const useGrantApplicationUrl = (program: ConfigurableGrantProgramSlug): string | undefined => {
  const { data } = trpc.programs.getBySlug.useQuery({ slug: program });
  const { latestUtmParams } = useLatestUtmParams();

  const applicationUrl = data?.applicationForm;
  if (!applicationUrl) return undefined;

  return buildApplicationUrl(applicationUrl, latestUtmParams.utm_source);
};
