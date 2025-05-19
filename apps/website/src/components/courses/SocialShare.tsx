import { addQueryParam, ClickTarget, useAuthStore } from '@bluedot/ui';
import React from 'react';
import { FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa6';
import useAxios from 'axios-hooks';

type SocialShareProps = {
  coursePath: string;
  text?: string;
};

type GetReferralResponse = {
  type: 'success';
  referralId: string;
};

const SocialShare: React.FC<SocialShareProps> = ({ coursePath, text }) => {
  const auth = useAuthStore((s) => s.auth);

  const [{ data }] = useAxios<GetReferralResponse>({
    method: 'get',
    url: '/api/referrals',
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  });

  const constructFullCourseUrl = (campaign: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${coursePath}?utm_source=referral&utm_campaign=${campaign}`;
    return data?.referralId ? addQueryParam(url, 'r', data.referralId) : url;
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
