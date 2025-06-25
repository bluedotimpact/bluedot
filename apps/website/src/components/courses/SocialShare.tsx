import { SocialShare as UISocialShare, useAuthStore } from '@bluedot/ui';
import React from 'react';
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

  return (
    <UISocialShare
      path={coursePath}
      text={text}
      referralId={data?.referralId}
    />
  );
};

export default SocialShare;
