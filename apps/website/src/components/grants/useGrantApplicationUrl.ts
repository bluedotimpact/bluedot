import { useLatestUtmParams } from '@bluedot/ui';
import { buildApplicationUrl } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import {
  GRANT_PROGRAM_SECTIONS,
  type ConfigurableGrantProgramSlug,
} from './grantPrograms';

export const useGrantApplicationUrl = (program: ConfigurableGrantProgramSlug): string => {
  const { data: programs } = trpc.programs.getAll.useQuery();
  const { latestUtmParams } = useLatestUtmParams();

  const fromAirtable = programs?.find((p) => p.slug === program)?.applicationForm;
  const applicationUrl = fromAirtable ?? GRANT_PROGRAM_SECTIONS[program].applicationUrl;

  return buildApplicationUrl(applicationUrl, latestUtmParams.utm_source);
};
