import type React from 'react';
import clsx from 'clsx';
import { H3, P } from '@bluedot/ui';
import SocialShare from './SocialShare';
import FoAICongratulations from './FoAICongratulations';
import { FOAI_COURSE_ID } from '../../lib/constants';

type CongratulationsProps = {
  courseTitle: string;
  coursePath: string;
  courseId?: string;
  text?: string;
  className?: string;
};

const Congratulations: React.FC<CongratulationsProps> = ({
  courseTitle,
  coursePath,
  courseId,
  text,
  className,
}) => {
  // Use dedicated FoAI component for Future of AI course
  if (courseId === FOAI_COURSE_ID) {
    return <FoAICongratulations className={className} />;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const socialShareText = text || `🎉 I just completed the ${courseTitle} course from BlueDot Impact! It's free, self-paced, and packed with insights. Check it out:`;

  return (
    <div className={clsx('congratulations flex flex-col gap-4 container-lined p-4 bg-white items-center', className)}>
      <H3 className="congratulations__title text-center pt-2">
        Congratulations on completing {courseTitle}!
      </H3>
      <P className="congratulations__description text-center">
        Now share your perspective! Those reflections aren't going to achieve much sitting in an exercise box. Share them with your network to get the conversation going.
      </P>
      <SocialShare
        coursePath={coursePath}
        text={socialShareText}
      />
    </div>
  );
};

export default Congratulations;
