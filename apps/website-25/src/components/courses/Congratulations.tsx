import React from 'react';
import SocialShare from './SocialShare';

type CongratulationsProps = {
  courseTitle: string;
  courseUrl: string;
  referralCode?: string;
  text?: string;
};

const Congratulations: React.FC<CongratulationsProps> = ({
  courseTitle,
  courseUrl,
  referralCode,
  text,
}) => {
  return (
    <div className="congratulations flex flex-col gap-4 container-lined p-4 bg-white items-center">
      <h3 className="congratulations__title text-center">Congratulations on completing {courseTitle}!</h3>
      <p className="congratulations__description text-center">
        Now share your perspective! Those reflections aren't going to achieve much sitting in an exercise box. Share them with your network to get the conversation going.
      </p>
      <SocialShare
        courseUrl={courseUrl}
        referralCode={referralCode}
        text={text}
      />
    </div>
  );
};

export default Congratulations;
