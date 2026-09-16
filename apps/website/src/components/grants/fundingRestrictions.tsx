import { A } from '@bluedot/ui';
import type { FAQItem } from '../lander/components/FAQSection';
import { ROUTES } from '../../lib/routes';

const GRANT_LOCATION_RESTRICTION = 'We are currently unable to fund people based in Russia, China or India.';
const GRANT_SANCTIONS_RESTRICTION = 'We cannot fund individuals or organizations where doing so would breach applicable sanctions.';

export const FUNDING_RESTRICTIONS_FAQ: FAQItem = {
  id: 'funding-restrictions',
  question: 'What funding restrictions apply?',
  answer: (
    <>
      {GRANT_LOCATION_RESTRICTION} {GRANT_SANCTIONS_RESTRICTION}
      <br />
      <br />
      Unsure whether a restriction applies? <A href={ROUTES.contact.url}>Contact us before applying</A>.
    </>
  ),
  answerText: `${GRANT_LOCATION_RESTRICTION} ${GRANT_SANCTIONS_RESTRICTION} Unsure whether a restriction applies? Contact us before applying.`,
};
