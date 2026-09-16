import { A, H3, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

export const GRANT_LOCATION_RESTRICTION = 'We are currently unable to fund people based in Russia, China or India.';
export const GRANT_SANCTIONS_RESTRICTION = 'We cannot fund individuals or organizations where doing so would breach applicable sanctions.';

const GrantEligibilityNotice = () => (
  <aside id="funding-restrictions" aria-labelledby="funding-restrictions-heading" className="scroll-mt-28 border-t border-bluedot-navy/10 pt-6">
    <H3><span id="funding-restrictions-heading">Funding restrictions</span></H3>
    <P className="mt-4 max-w-[780px] text-size-sm text-secondary">
      {GRANT_LOCATION_RESTRICTION} {GRANT_SANCTIONS_RESTRICTION}
    </P>
    <P className="mt-4 text-size-sm text-secondary">
      Unsure whether a restriction applies? <A href={ROUTES.contact.url}>Contact us before applying</A>.
    </P>
  </aside>
);

export default GrantEligibilityNotice;
