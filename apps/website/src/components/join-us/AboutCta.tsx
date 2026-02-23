import { CTALinkOrButton } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const AboutCta = () => {
  return (
    <div className="about-cta w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16 flex justify-center">
      <CTALinkOrButton
        className="about-cta__cta-button"
        variant="primary"
        withChevron
        url={ROUTES.about.url}
      >
        Learn more about us
      </CTALinkOrButton>
    </div>
  );
};

export default AboutCta;
