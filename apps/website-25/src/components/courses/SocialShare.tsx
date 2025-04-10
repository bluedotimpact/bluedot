import React from 'react';
import { FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa6';

type SocialShareProps = {
  courseUrl: string;
  referralCode?: string;
  text?: string;
};

const SocialShare: React.FC<SocialShareProps> = ({ courseUrl, referralCode, text }) => {
  return (
    <div className="social-share flex flex-row gap-4">
      <a
        className="social-share__link size-6"
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${courseUrl}?r=${referralCode}&utm_source=referral&utm_campaign=linkedin&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaLinkedin className="social-share__link-icon size-6" />
      </a>
      <a
        className="social-share__link size-6"
        href={`https://twitter.com/intent/tweet?text=${text}&url=${courseUrl}?r=${referralCode}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaTwitter className="social-share__link-icon size-6" />
      </a>
      <a
        className="social-share__link size-6"
        href={`https://www.facebook.com/sharer/sharer.php?u=${courseUrl}?r=${referralCode}&utm_source=referral&utm_campaign=fb&quote=${text}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaFacebook className="social-share__link-icon size-6" />
      </a>
    </div>
  );
};

export default SocialShare;
