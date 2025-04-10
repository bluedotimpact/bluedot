import React from 'react';
import SocialShare from './SocialShare';

type CongratulationsProps = {
  courseTitle: string;
  coursePath: string;
  referralCode?: string;
  text?: string;
};

const Congratulations: React.FC<CongratulationsProps> = ({
  courseTitle,
  coursePath,
  referralCode,
  text,
}) => {
  const socialShareText = text || 
    `🎉 I just completed the ${courseTitle} course from BlueDot Impact! It’s free, self-paced, and packed with insights. Check it out and sign up with my referral link below:`;

  return (
    <div className="congratulations flex flex-col gap-4 container-lined p-4 bg-white items-center">
      <h3 className="congratulations__title text-center">Congratulations on completing {courseTitle}!</h3>
      <p className="congratulations__description text-center">
        Now share your perspective! Those reflections aren't going to achieve much sitting in an exercise box. Share them with your network to get the conversation going.
      </p>
      <SocialShare
        coursePath={coursePath}
        referralCode={referralCode}
        text={socialShareText}
      />
    </div>
  );
};

export default Congratulations;
