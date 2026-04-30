import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import {
  GRANT_PROGRAM_SECTIONS,
  type ConfigurableGrantProgramSlug,
} from './grantPrograms';

export const useGrantApplicationUrl = (program: ConfigurableGrantProgramSlug): string => {
  const { applicationUrl } = GRANT_PROGRAM_SECTIONS[program];
  const { latestUtmParams } = useLatestUtmParams();

  return appendPosthogSessionIdPrefill(latestUtmParams.utm_source
    ? addQueryParam(applicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : applicationUrl);
};
