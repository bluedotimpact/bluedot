import React from 'react';
import { CTAButton } from '@bluedot/ui';

const Callout: React.FC = () => {
  const title = 'Join us in our mission to ensure humanity safely navigates the transition to transformative AI.';
  const ctaLabel = 'View our careers';

  return (
    <div className="callout bg-[radial-gradient(ellipse_at_30%,_#fff_0%,_#6687ff_100%)] rounded-lg py-16 px-8 m-8 flex flex-col items-center">
      <h2 className="callout__title mb-4 text-center">{title}</h2>
      <CTAButton
        variant="primary"
        withChevron
        className="callout__cta"
      >
        {ctaLabel}
      </CTAButton>
    </div>
  );
};

export default Callout;
