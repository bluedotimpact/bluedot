import React from 'react';
import { CTAButton } from '@bluedot/ui';

const Callout: React.FC = () => {
  const title = 'Join us in our mission to ensure humanity safely navigates the transition to transformative AI.';
  const ctaLabel = 'View our careers';
  const ctaLink = '/careers';

  return (
    <div className="bg-[radial-gradient(circle_at_center,#6687FF_0%,white_100%)] rounded-lg p-8 flex flex-col items-center">
      <h2 className="text-black font-bold text-2xl mb-4 text-center">{title}</h2>
      <CTAButton variant="primary" onClick={() => window.open(ctaLink, '_blank')} withChevron>
        {ctaLabel}
      </CTAButton>
    </div>
  );
};

export default Callout;
