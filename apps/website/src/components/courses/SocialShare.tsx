import { SocialShare as UISocialShare } from '@bluedot/ui';
import type React from 'react';

type SocialShareProps = {
  coursePath: string;
  text?: string;
};

const SocialShare: React.FC<SocialShareProps> = ({ coursePath, text }) => {
  return (
    <UISocialShare
      path={coursePath}
      text={text}
    />
  );
};

export default SocialShare;
