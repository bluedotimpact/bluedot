import { CTALinkOrButton } from '@bluedot/ui';
import { CAREER_TRANSITION_GRANT_APPLICATION_URL } from '../grants/grantPrograms';

const Cta = () => {
  return (
    <div className="career-transition-grant-cta w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16 flex justify-center">
      <CTALinkOrButton
        variant="primary"
        withChevron
        url={CAREER_TRANSITION_GRANT_APPLICATION_URL}
        target="_blank"
      >
        Apply now
      </CTALinkOrButton>
    </div>
  );
};

export default Cta;
