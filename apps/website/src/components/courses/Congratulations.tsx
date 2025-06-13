import React from 'react';
import clsx from 'clsx';
import SocialShare from './SocialShare';
import { H3, P } from '../Text';

type CongratulationsProps = {
  courseTitle: string;
  coursePath: string;
  text?: string;
  className?: string;
};

const Congratulations: React.FC<CongratulationsProps> = ({
  courseTitle,
  coursePath,
  text,
  className,
}) => {
  const socialShareText = text || `🎉 I just completed the ${courseTitle} course from BlueDot Impact! It’s free, self-paced, and packed with insights. Check it out and sign up with my referral link below:`;

  return (
    <div className={clsx('congratulations flex flex-col gap-4 container-lined p-4 bg-white items-center', className)}>
      <H3 className="congratulations__title text-center">Congratulations on completing {courseTitle}!</H3>
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
