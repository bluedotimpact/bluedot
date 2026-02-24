import { CTALinkOrButton } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const JoinUsCta = () => {
  return (
    <div className="join-us-cta w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16 flex justify-center">
      <CTALinkOrButton
        className="join-us-cta__cta-button"
        variant="primary"
        withChevron
        url={ROUTES.joinUs.url}
      >
        Join our team
      </CTALinkOrButton>
    </div>
  );
};

export default JoinUsCta;
