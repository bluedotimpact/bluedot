import type React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton, P } from '@bluedot/ui';

type FoAICongratulationsProps = {
  className?: string;
};

const FoAICongratulations: React.FC<FoAICongratulationsProps> = ({ className }) => {
  return (
    <div className={clsx('congratulations container-lined p-8 bg-white', className)}>
      <div className="flex flex-col gap-2">
        <p className="congratulations__title bluedot-h4 mb-2 text-center">
          Congratulations on completing the Future of AI course!
        </p>
        <P className="congratulations__description">
          Want to go deeper? <span className="font-semibold">The AGI Strategy course</span> is the natural next step: 25 hours, facilitated in small groups with live discussion. No specific background required. New rounds start every month.
        </P>
      </div>
      <div className="mt-4 flex justify-start">
        <CTALinkOrButton
          url="/courses/agi-strategy"
          variant="primary"
          withChevron
        >
          Apply now
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default FoAICongratulations;
