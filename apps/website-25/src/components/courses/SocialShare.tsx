import React from 'react';
import { FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa6';

type SocialShareProps = {
  coursePath: string;
  referralCode?: string;
  text?: string;
};

const SocialShare: React.FC<SocialShareProps> = ({ coursePath, referralCode, text }) => {
  const constructFullCourseUrl = (campaign: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${coursePath}?utm_source=referral&utm_campaign=${campaign}`;
    return referralCode ? `${url}&r=${referralCode}` : url;
  };

  return (
    <div className="social-share flex flex-row gap-4 items-center">
      <a
        className="social-share__link size-6"
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(constructFullCourseUrl('linkedin'))}${text && `&text=${text}`}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaLinkedin className="social-share__link-icon size-6" />
      </a>
      <a
        className="social-share__link size-6"
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(constructFullCourseUrl('twitter'))}${text && `&text=${text}`}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaTwitter className="social-share__link-icon size-6" />
      </a>
      <a
        className="social-share__link size-6"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(constructFullCourseUrl('facebook'))}${text && `&quote=${text}`}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaFacebook className="social-share__link-icon size-6" />
      </a>
    </div>
  );
};

export default SocialShare;
