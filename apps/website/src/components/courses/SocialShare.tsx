import { addQueryParam, ClickTarget } from '@bluedot/ui';
import React from 'react';
import { FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa6';

type SocialShareProps = {
  coursePath: string;
  referralCode?: string;
  text?: string;
};

const SocialShare: React.FC<SocialShareProps> = ({ coursePath, referralCode, text }) => {
  const auth = useAuthStore((s) => s.auth);

  const [{ data: referralData, loading: referralLoading, error: referralError }] = useAxios<GetReferralResponse>({
    method: 'get',
    url: '/api/referral',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const constructFullCourseUrl = (campaign: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${coursePath}?utm_source=referral&utm_campaign=${campaign}`;
    return referralCode ? addQueryParam(url, 'r', referralCode) : url;
  };

  return (
    <div className="social-share flex flex-row gap-4">
      <ClickTarget
        className="social-share__link size-6"
        url={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(constructFullCourseUrl('linkedin'))}${text ? `&text=${text}` : ''}`}
        target="_blank"
      >
        <FaLinkedin className="social-share__link-icon size-6" />
      </ClickTarget>
      <ClickTarget
        className="social-share__link size-6"
        url={`https://twitter.com/intent/tweet?url=${encodeURIComponent(constructFullCourseUrl('twitter'))}${text ? `&text=${text}` : ''}`}
        target="_blank"
      >
        <FaTwitter className="social-share__link-icon size-6" />
      </ClickTarget>
      <ClickTarget
        className="social-share__link size-6"
        url="https://www.facebook.com/sharer/sharer.php"
        target="_blank"
      >
        <FaFacebook className="social-share__link-icon size-6" />
      </ClickTarget>
    </div>
  );
};

export default SocialShare;
