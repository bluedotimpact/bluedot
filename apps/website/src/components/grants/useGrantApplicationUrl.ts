import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
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

  return appendPosthogSessionIdPrefill(latestUtmParams.utm_source
    ? addQueryParam(applicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : applicationUrl);
};
