import type React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';

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
        <p className="congratulations__description bluedot-p">
          Want to connect with others taking AI safety seriously? <span className="font-semibold">Join 3,000+ FoAI course graduates</span> turning knowledge into action.
        </p>
      </div>
      <div className="mt-4 flex justify-start">
        <CTALinkOrButton
          url="https://community.bluedot.org"
          variant="primary"
          target="_blank"
        >
          Join the Community
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default FoAICongratulations;
