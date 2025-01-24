import React from 'react';
import { CTAButton } from '@bluedot/ui';

const Callout: React.FC = () => {
  const title = 'Join us in our mission to ensure humanity safely navigates the transition to transformative AI.';
  const ctaLabel = 'View our careers';
  const ctaLink = '/careers';

  return (
    <div className="callout bg-[radial-gradient(ellipse_at_30%,_#fff_0%,_#6687ff_100%)] rounded-lg p-8 m-8 flex flex-col items-center">
      <h2 className="callout__title text-black font-bold text-2xl mb-4 text-center">{title}</h2>
      <CTAButton
        variant="primary"
        onClick={() => window.open(ctaLink, '_blank')}
        withChevron
        className="callout__cta"
      >
        {ctaLabel}
      </CTAButton>
    </div>
  );
};

export default Callout;